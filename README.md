# HMI2 - MetaHuman Web Interface

In diesem Projekt wird eine Webanwendung zur Interaktion mit einem KI-basierten virtuellen Agenten umgesetzt. Die Kommunikation erfolgt über eine Chatoberfläche, während Audio- und Videoausgabe eine natürliche Darstellung ermöglichen. Die KI-Verarbeitung erfolgt lokal über ein Sprachmodell, das in Echtzeit mit der Benutzeroberfläche und einer Unity-Anwendung gekoppelt ist.

## Features

-   **Bimodal Interaction**: Echtzeit-Chat und Video-Streaming via WebRTC.
-   **Local AI Power**: Nutzt Ollama (Llama 3.1) für datenschutzfreundliche, lokale Inferenz.
-   **Automatic Model Management**: Erkennt automatisch fehlende Modelle und lädt diese bei Bedarf herunter.
-   **Dynamic Avatar**: WebRTC-basierter Videostream aus Unity mit lippensynchroner Sprachausgabe.
-   **Character Switching**: Wechseln Sie zwischen verschiedenen Charakteren direkt im Interface.
-   **Modern UI**: Anpassbares Layout mit Resizable Cards für Chat und Video.

## Prerequisites

-   **Node.js** (v18 or later)
-   **Unity 2022+** (für das Avatar-Backend)
-   **Ollama** (für lokales LLM Support)
-   **Unreal Speech API Key** (für High-Quality TTS)

## Installation (Web App)

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```

2.  Start Signaling Server (WebRTC Handshake):
    ```bash
    cd HMI2/SignalingServer
    npm install
    npm start
    ```

3.  Start Frontend (WebRTC Client):
    ```bash
    cd HMI2/webrtc-client
    npm install
    npm start
    ```
    The Frontend will be available at [http://localhost:3000](http://localhost:3000).

## Backend Avatar Setup
1.  **Unity Projekt öffnen**:
    Öffnen Sie den Ordner `Chatbot_Avatar` in Unity.

2.  **Unreal Speech Setup**:
    -   Melden Sie sich bei [Unreal Speech](https://unrealspeech.com/) an.
    -   Kopieren Sie Ihren API Key.
    -   Fügen Sie den Key in die Datei `TextToSpeech.cs` in Unity ein.

3.  **Starten**:
    -   Führen Sie das Unity-Projekt im Editor aus **ODER**
    -   Starten Sie den Build unter `Builds/Windows/Chatbot_Avater.exe`.
    *(Hinweis: Im Build ist der API Key möglicherweise nicht hinterlegt, falls er vor dem Build nicht eingetragen wurde.)*

## LLM Setup (Ollama)

1.  Installieren Sie [Ollama](https://ollama.com/).
2.  Starten Sie den Ollama Server:
    ```bash
    ollama serve
    ```
3.  **Automatisch**: Die Web-App prüft beim Start, ob `llama3.1` vorhanden ist und lädt es gegebenenfalls automatisch herunter.
4.  **Manuell (Optional)**:
    ```bash
    ollama pull llama3.1
    ```