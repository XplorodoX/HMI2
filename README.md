# HMI2 - MetaHuman Web Interface

In diesem Projekt wird eine Webanwendung zur Interaktion mit einem KI-basierten virtuellen Agenten umgesetzt. Die Kommunikation erfolgt über eine Chatoberfläche, während Audio- und Videoausgabe eine natürliche Darstellung ermöglichen. Die KI-Verarbeitung erfolgt lokal über ein Sprachmodell, das in Echtzeit mit der Benutzeroberfläche und einer Unity-Anwendung gekoppelt ist.

## Prerequisites

-   **Node.js** (v18 or later)
-   **Unreal Engine 5.0+**
-   **Ollama** (for local LLM support)

## Installation (Web App)

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Start Signaling Server dependencies:
    ```bash
    cd HMI2/SignalingServer
    npm install
    npm start
    ```

3.  Start Frontend:
    ```bash
    cd HMI2/Frontend
    npm install
    npm start
    ```
    The Frontend will be available at [http://localhost:3000](http://localhost:3000).

## Backend Avatar Setup
    1. Chatbot_Avatar Unity Projekt öffnen

    2. Unreal Engine speech anmelden und api key kopieren

    3. In der TextToSpeech.cs Datei den api Key einfügen

    4. Unity Projekt ausführen

    5.Hinweis: Es kann auch der Unity build (also die Chatbot_Avatar.exe) gestartet werden. Jedoch ist dort der api key nicht hinterlegt und deshalb wird immer ein hinterlegter Text ausgegeben.



## LLM Setup (Ollama)

1.  Install [Ollama](https://ollama.com/).
2.  Pull the model used in the app (default `llama3.1`):
    ```bash
    ollama pull llama3.1
    ```
3.  Start the Ollama server:
    ```bash
    ollama serve
    ```