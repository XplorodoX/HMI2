import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        // Configuration for Ollama
        // Ensure Ollama is running: `ollama serve`
        const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate';
        const MODEL_NAME = 'gpt-oss:20b'; // Or 'llama3', 'mistral', etc.

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
        });

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
            // Check if 'response' exists
            if (!data.response) {
                throw new Error("No 'response' field in Ollama output");
            }
            parsedResponse = JSON.parse(data.response);
        } catch (e: any) {
            // Fallback if LLM didn't output valid JSON
            console.error("Failed to parse LLM JSON:", e);
            console.log("Falling back to raw text.");
            parsedResponse = { text: data.response || `Error: ${e.message}`, emotion: "Neutral" };
        }

        return NextResponse.json(parsedResponse);

    } catch (error) {
        console.error('Error communicating with Ollama:', error);
        return NextResponse.json(
            { error: 'Failed to communicate with AI service.' },
            { status: 500 }
        );
    }
}
