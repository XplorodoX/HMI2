import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const OLLAMA_URL = 'http://127.0.0.1:11434/api/tags';
        
        const response = await fetch(OLLAMA_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract model names from the response
        const models = data.models?.map((model: { name: string }) => model.name) || [];
        
        return NextResponse.json({ models });

    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        return NextResponse.json(
            { error: 'Failed to fetch models from Ollama', models: [] },
            { status: 500 }
        );
    }
}
