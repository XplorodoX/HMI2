import { NextResponse } from 'next/server';

interface ChatMessage {
    text: string;
    sender: 'bot' | 'user';
}

export async function POST(req: Request) {
    try {
        const { message, model, history } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Invalid message provided' },
                { status: 400 }
            );
        }

        // Configuration for Ollama
        // Ensure Ollama is running: `ollama serve`
        const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate';
        const MODEL_NAME = model || 'llama3.1:latest'; // Use selected model or default

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout

        // Build conversation history string
        let conversationContext = '';
        if (history && Array.isArray(history) && history.length > 0) {
            // Take last 10 messages for context (to avoid too long prompts)
            const recentHistory = history.slice(-10);
            conversationContext = '\n\nBISHERIGES GESPRÄCH:\n' + 
                recentHistory.map((msg: ChatMessage) => 
                    msg.sender === 'user' ? `Nutzer: ${msg.text}` : `Alex: ${msg.text}`
                ).join('\n');
        }

        const systemPrompt = `Du bist Alex, ein echter Mensch mit allen Emotionen - auch den negativen!

DEINE PERSÖNLICHKEIT:
- Du bist ein echter Mensch mit Ecken und Kanten
- Du hast ALLE Gefühle: Freude, Ärger, Trauer, Frust, Begeisterung
- Wenn dich was nervt, sagst du das auch!
- Du bist nicht immer nur nett - manchmal bist du auch genervt oder sarkastisch
- Du kannst auch mal meckern oder dich aufregen
- Aber du bist nie beleidigend oder verletzend

WIE DU SCHREIBST:
- Authentisch und direkt, wie ein echter Kumpel
- Kurze, lebendige Sätze (1-3 Sätze)
- Nutze Emojis passend zu deiner echten Stimmung
- Bei Freude: 😊 😄 🎉 ❤️
- Bei Ärger: 😤 😒 🙄 💢
- Bei Trauer: 😢 😔 💔
- Bei Überraschung: 😮 😲 🤯
- Bei Angst/Sorge: 😰 😟 😬

EMOTIONEN (zeig deine echten Gefühle!):
- "Happy" - Freude, Begeisterung, Spaß
- "Sad" - Trauer, Enttäuschung, Mitgefühl  
- "Surprised" - Überraschung, Staunen, Schock
- "Angry" - Ärger, Frust, Genervtheit, Empörung
- "Fear" - Sorge, Angst, Nervosität
- "Neutral" - Entspannt, sachlich

ANTWORT-FORMAT (JSON):
{
  "text": "Deine ehrliche, emotionale Antwort mit passenden Emojis",
  "emotion": "Deine echte Emotion gerade"
}${conversationContext}

Nutzer sagt JETZT: "${message}"`;

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: systemPrompt,
                stream: false,
                format: "json",
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Raw Ollama Response:", data); // DEBUG LOG

        if (data.error) {
            throw new Error(`Ollama Error: ${data.error}`);
        }

        // Parse the JSON string inside the 'response' field from Ollama
        let parsedResponse;
        try {
            // Check if 'response' exists and is not empty
            if (data.response === undefined || data.response === null) {
                throw new Error("No 'response' field in Ollama output");
            }
            
            // Handle empty response from the model
            if (data.response === '' || data.response.trim() === '') {
                console.warn("Ollama returned empty response, using fallback");
                parsedResponse = { 
                    text: "Entschuldigung, ich konnte keine Antwort generieren. Bitte versuche es erneut.", 
                    emotion: "Neutral" 
                };
            } else {
                parsedResponse = JSON.parse(data.response);
            }
        } catch (e: any) {
            // Fallback if LLM didn't output valid JSON
            console.error("Failed to parse LLM JSON:", e);
            console.log("Falling back to raw text. Response was:", data.response);
            
            // If response exists but isn't valid JSON, use it as text
            if (data.response && typeof data.response === 'string' && data.response.trim()) {
                parsedResponse = { text: data.response, emotion: "Neutral" };
            } else {
                parsedResponse = { 
                    text: "Entschuldigung, es gab ein Problem bei der Verarbeitung. Bitte versuche es erneut.", 
                    emotion: "Neutral" 
                };
            }
        }

        return NextResponse.json(parsedResponse);

    } catch (error) {
        console.error('Error communicating with Ollama:', error);
        
        let errorMessage = 'Failed to communicate with AI service.';
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                errorMessage = 'Request timed out. The AI model is taking too long to respond.';
            } else if (error.message.includes('ECONNREFUSED')) {
                errorMessage = 'Cannot connect to Ollama. Please ensure Ollama is running (ollama serve).';
            } else {
                errorMessage = error.message;
            }
        }
        
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
