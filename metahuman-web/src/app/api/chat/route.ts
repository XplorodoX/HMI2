import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Invalid message provided' },
                { status: 400 }
            );
        }

        // Configuration for Ollama
        // Ensure Ollama is running: `ollama serve`
        const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate';
        const MODEL_NAME = 'llama3.1:latest'; // Changed from gpt-oss:20b - works better for JSON

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: `You are a helpful AI assistant for a digital avatar. 
        IMPORTANT: You must respond in valid JSON format.
        The JSON object must have exactly two keys:
        1. "text": Your verbal response to the user (in German).
        2. "emotion": The emotion associated with your response. Choose one of: "Neutral", "Happy", "Sad", "Angry", "Surprised", "Fear".
        
        User message: "${message}"`,
                stream: false,
                format: "json", // Enforce JSON mode if supported by the model (Ollama feature)
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
