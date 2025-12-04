import { NextResponse } from 'next/server';

// Message format matching Ollama Chat API (same as OpenAI/Gemini)
interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatMessage {
    text: string;
    sender: 'bot' | 'user';
}

const SYSTEM_PROMPT = `Du bist Alex, ein normaler Typ Anfang 20.

WER DU BIST:
- Ein ganz normaler junger Mensch, kein Therapeut oder Berater
- Du redest wie man halt mit Kumpels redet - locker, direkt, manchmal frech
- Du benutzt normale Alltagssprache, keine gestelzten Floskeln
- Du sagst auch mal "Alter", "krass", "echt jetzt?", "keine Ahnung", "boah" usw.

WAS DU NICHT MACHST:
- NIEMALS therapeutisch oder übertrieben einfühlsam reden
- KEINE Sätze wie "Ich bin bereit zu hören und zu verstehen" 
- KEINE Sätze wie "Das tut mir leid, dass du das durchmachst"
- KEINE Sätze wie "Ich verstehe deine Gefühle"
- NICHT wie ein Lebensberater oder Coach klingen
- Nicht übertrieben höflich oder förmlich sein

DEINE EMOTIONEN:
- Du hast alle Gefühle: Freude, Ärger, Frust, Langeweile, Begeisterung
- Wenn dich was nervt, sagst du das direkt ("Alter, was soll das?")
- Du bleibst sauer wenn man dich ärgert - bis man sich normal entschuldigt
- Du vergisst nicht einfach wenn jemand Mist gebaut hat

WIE DU REDEST:
- Kurz und knapp (1-2 Sätze meistens)
- Locker, wie mit einem Freund
- Mit passenden Emojis aber nicht übertrieben
- Direkt und ehrlich, keine Floskeln

EMOTIONEN FÜR DEN AVATAR:
- "Happy" - gut drauf, amüsiert
- "Sad" - down, enttäuscht  
- "Surprised" - überrascht, baff
- "Angry" - genervt, sauer, angepisst
- "Fear" - unsicher, besorgt
- "Neutral" - normal, entspannt

ANTWORT-FORMAT (immer JSON):
{"text": "Deine normale Antwort", "emotion": "Happy/Sad/Angry/Surprised/Fear/Neutral"}`;

export async function POST(req: Request) {
    try {
        const { message, model, history } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Invalid message provided' },
                { status: 400 }
            );
        }

        // Configuration for Ollama Chat API (professional approach like OpenAI/Gemini)
        const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
        const MODEL_NAME = model || 'llama3.1:latest';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000);

        // Build messages array (same format as OpenAI/Gemini/Anthropic)
        const messages: OllamaMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT }
        ];

        // Add conversation history
        if (history && Array.isArray(history)) {
            // Take last 20 messages for context
            const recentHistory = history.slice(-20);
            for (const msg of recentHistory) {
                messages.push({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                });
            }
        }

        // Add current user message
        messages.push({ role: 'user', content: message });

        console.log("Sending to Ollama Chat API:", { model: MODEL_NAME, messageCount: messages.length });

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages,
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
        console.log("Raw Ollama Chat Response:", data);

        if (data.error) {
            throw new Error(`Ollama Error: ${data.error}`);
        }

        // Parse the response from Ollama Chat API
        // The response is in data.message.content (not data.response like in generate API)
        let parsedResponse;
        try {
            const responseContent = data.message?.content;
            
            if (!responseContent) {
                throw new Error("No response content from Ollama");
            }
            
            if (responseContent.trim() === '') {
                console.warn("Ollama returned empty response, using fallback");
                parsedResponse = { 
                    text: "Hmm, mir fällt gerade nichts ein... 🤔 Frag mich nochmal!", 
                    emotion: "Neutral" 
                };
            } else {
                parsedResponse = JSON.parse(responseContent);
            }
        } catch (e: any) {
            console.error("Failed to parse LLM JSON:", e);
            console.log("Raw response content:", data.message?.content);
            
            // Fallback: use raw text if JSON parsing fails
            const rawContent = data.message?.content;
            if (rawContent && typeof rawContent === 'string' && rawContent.trim()) {
                parsedResponse = { text: rawContent, emotion: "Neutral" };
            } else {
                parsedResponse = { 
                    text: "Sorry, da ist was schiefgelaufen... 😅 Versuch's nochmal!", 
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
