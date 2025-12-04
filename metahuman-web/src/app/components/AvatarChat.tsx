"use client";

import React, { useState, useRef, useEffect } from 'react';

// We will rely on global CSS for simplicity in this prototype
// Ensure styles are added to globals.css

interface Message {
    id: number;
    text: string;
    sender: 'bot' | 'user';
}

const AvatarChat = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hallo! Ich bin dein virtueller Assistent. Wie kann ich dir heute helfen?", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = inputText;
        // Add User Message
        const newUserMsg: Message = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, newUserMsg]);
        setInputText("");

        // Call the API
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for LLM

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
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

            // Log emotion for now (later: send to Unreal)
            console.log("Avatar Emotion:", data.emotion);

            // Example: If we had the pixel streaming instance, we would do:
            // pixelStreaming.emitUIInteraction({ type: 'SetEmotion', value: data.emotion });
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

    return (
        <div className="avatar-chat-container">
            {/* Left Side: Chat */}
            <div className="chat-panel">
                <div className="chat-header">
                    <div className="status-dot"></div>
                    MetaHuman Assistant
                </div>

                <div className="chat-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender}`}>
                            {msg.text}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
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
