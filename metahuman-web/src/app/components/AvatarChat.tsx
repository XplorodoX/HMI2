"use client";

import React, { useState, useRef, useEffect } from 'react';

interface Message {
    id: number;
    text: string;
    sender: 'bot' | 'user';
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    model: string;
}

const AvatarChat = () => {
    // Chat sessions state
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hey! 👋 Was geht?", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState("");
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('llama3.1:latest');
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Load sessions from localStorage on mount
    useEffect(() => {
        const savedSessions = localStorage.getItem('chatSessions');
        if (savedSessions) {
            const parsed = JSON.parse(savedSessions);
            setSessions(parsed.map((s: ChatSession) => ({
                ...s,
                createdAt: new Date(s.createdAt)
            })));
        }
    }, []);

    // Save sessions to localStorage when they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('chatSessions', JSON.stringify(sessions));
        }
    }, [sessions]);

    // Auto-save current chat to session
    useEffect(() => {
        if (currentSessionId && messages.length > 1) {
            setSessions(prev => prev.map(session => 
                session.id === currentSessionId 
                    ? { ...session, messages, model: selectedModel }
                    : session
            ));
        }
    }, [messages, currentSessionId, selectedModel]);

    // Fetch available models on mount
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await fetch('/api/models');
                const data = await response.json();
                if (data.models && data.models.length > 0) {
                    setModels(data.models);
                    if (data.models.includes('llama3.1:latest')) {
                        setSelectedModel('llama3.1:latest');
                    } else {
                        setSelectedModel(data.models[0]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch models:', error);
            } finally {
                setIsLoadingModels(false);
            }
        };
        fetchModels();
    }, []);

    // Auto-scroll to bottom - only within chat messages container
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Generate title from first user message
    const generateTitle = (msg: string): string => {
        const maxLen = 30;
        const cleaned = msg.trim();
        if (cleaned.length <= maxLen) return cleaned;
        return cleaned.substring(0, maxLen) + '...';
    };

    // Start new chat
    const startNewChat = () => {
        // Save current chat if it has messages
        if (messages.length > 1 && !currentSessionId) {
            const userMsg = messages.find(m => m.sender === 'user');
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: userMsg ? generateTitle(userMsg.text) : 'Neuer Chat',
                messages: messages,
                createdAt: new Date(),
                model: selectedModel
            };
            setSessions(prev => [newSession, ...prev]);
        }
        
        // Reset to new chat
        setCurrentSessionId(null);
        setMessages([{ id: 1, text: "Hey! 👋 Was geht?", sender: 'bot' }]);
        setShowSidebar(false);
    };

    // Load a session
    const loadSession = (session: ChatSession) => {
        // Save current unsaved chat first
        if (messages.length > 1 && !currentSessionId) {
            const userMsg = messages.find(m => m.sender === 'user');
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: userMsg ? generateTitle(userMsg.text) : 'Neuer Chat',
                messages: messages,
                createdAt: new Date(),
                model: selectedModel
            };
            setSessions(prev => [newSession, ...prev]);
        }
        
        setCurrentSessionId(session.id);
        setMessages(session.messages);
        setSelectedModel(session.model);
        setShowSidebar(false);
    };

    // Delete a session
    const deleteSession = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
            startNewChat();
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = inputText;
        const newUserMsg: Message = { id: Date.now(), text: inputText, sender: 'user' };
        const updatedMessages = [...messages, newUserMsg];
        setMessages(updatedMessages);
        setInputText("");

        // Create session on first user message if none exists
        if (!currentSessionId && messages.length === 1) {
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: generateTitle(userMessage),
                messages: updatedMessages,
                createdAt: new Date(),
                model: selectedModel
            };
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newSession.id);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const chatHistory = messages.map(msg => ({ text: msg.text, sender: msg.sender }));
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMessage, 
                    model: selectedModel,
                    history: chatHistory 
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error("API Error:", errorData.error || response.statusText);
                const errorMsg: Message = { id: Date.now() + 1, text: `Fehler: ${errorData.error || 'Konnte KI nicht erreichen.'}`, sender: 'bot' };
                setMessages(prev => [...prev, errorMsg]);
                return;
            }

            const data = await response.json();
            const newBotMsg: Message = { id: Date.now() + 1, text: data.text, sender: 'bot' };
            setMessages(prev => [...prev, newBotMsg]);

            console.log("Avatar Emotion:", data.emotion);
        } catch (error) {
            console.error("Network Error:", error);
            let errorText = "Netzwerkfehler.";
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorText = "Zeitüberschreitung: Die Anfrage hat zu lange gedauert.";
                } else {
                    errorText = `Fehler: ${error.message}`;
                }
            }
            const errorMsg: Message = { id: Date.now() + 1, text: errorText, sender: 'bot' };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    const formatDate = (date: Date): string => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Heute';
        if (days === 1) return 'Gestern';
        if (days < 7) return `Vor ${days} Tagen`;
        return date.toLocaleDateString('de-DE');
    };

    return (
        <div className="avatar-chat-container">
            {/* Sidebar for chat history */}
            <div className={`chat-sidebar ${showSidebar ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>Chat Verlauf</h3>
                    <button className="close-sidebar" onClick={() => setShowSidebar(false)}>×</button>
                </div>
                <button className="new-chat-btn sidebar-new" onClick={startNewChat}>
                    <span>+</span> Neuer Chat
                </button>
                <div className="sessions-list">
                    {sessions.length === 0 ? (
                        <div className="no-sessions">Keine gespeicherten Chats</div>
                    ) : (
                        sessions.map(session => (
                            <div 
                                key={session.id} 
                                className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
                                onClick={() => loadSession(session)}
                            >
                                <div className="session-info">
                                    <span className="session-title">{session.title}</span>
                                    <span className="session-date">{formatDate(session.createdAt)}</span>
                                </div>
                                <button 
                                    className="delete-session"
                                    onClick={(e) => deleteSession(session.id, e)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Overlay when sidebar is open */}
            {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />}

            {/* Left Side: Chat */}
            <div className="chat-panel">
                <div className="chat-header">
                    <button className="menu-btn" onClick={() => setShowSidebar(true)}>
                        ☰
                    </button>
                    <div className="status-dot"></div>
                    <span>Alex</span>
                    <button className="new-chat-btn header-new" onClick={startNewChat}>
                        + Neu
                    </button>
                </div>

                <div className="chat-messages" ref={messagesContainerRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender}`}>
                            {msg.text}
                        </div>
                    ))}
                </div>

                <div className="chat-input-area">
                    <div className="model-select-wrapper">
                        <span className="model-label">Modell:</span>
                        <select
                            className="model-select"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={isLoadingModels}
                        >
                            {isLoadingModels ? (
                                <option>Lade Modelle...</option>
                            ) : models.length > 0 ? (
                                models.map((model) => (
                                    <option key={model} value={model}>
                                        {model}
                                    </option>
                                ))
                            ) : (
                                <option>Keine Modelle verfügbar</option>
                            )}
                        </select>
                    </div>
                    <div className="input-row">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Schreibe eine Nachricht..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                        <button className="send-btn" onClick={handleSendMessage}>
                            Senden
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Stream */}
            <div className="stream-panel">
                <div className="overlay-info">Live Stream via Unreal Engine</div>
                <iframe
                    src="http://localhost"
                    className="stream-iframe"
                    allow="autoplay; microphone; camera; fullscreen"
                    title="MetaHuman Stream"
                />
            </div>
        </div>
    );
};

export default AvatarChat;
