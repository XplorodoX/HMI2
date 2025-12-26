import { useEffect, useRef, useState } from "react";

function App() {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(new MediaStream());

  const [inputText, setInputText] = useState("");

  function change_character(id) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "character",
        text: id.toString()
      }));
    }
  }

  function send_message() {
    if (inputText.trim() === "") return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        text: inputText
      }));
      console.log("📤 Sent to Unity:", inputText);
      setInputText("");
    }
  }

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });

    pcRef.current = pc;

    pc.ontrack = (event) => {
      streamRef.current.addTrack(event.track);

      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.warn("Autoplay wait:", e));
        };
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current.send(JSON.stringify({
          type: "ice",
          candidate: event.candidate
        }));
      }
    };

    const ws = new WebSocket("ws://localhost:3001");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "request_offer" }));
    };
    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "offer" && msg.offer) {
        if (pc.signalingState !== "stable") {
          console.log("Signaling state is not stable, ignoring duplicate offer.");
          return;
        }
        const offerDesc = new RTCSessionDescription({
          type: "offer",
          sdp: msg.offer
        });

        await pc.setRemoteDescription(offerDesc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        ws.send(JSON.stringify({
          type: "answer",
          answer: answer.sdp
        }));
      }

      if (msg.type === "ice" && msg.candidate) {
        const candidate = new RTCIceCandidate({
          candidate: msg.candidate.candidate,
          sdpMid: msg.candidate.sdpMid,
          sdpMLineIndex: msg.candidate.sdpMLineIndex
        });

        await pc.addIceCandidate(candidate);
      }
    };

    return () => {
      pc.close();
      ws.close();
    };
  }, []);

  /*return (
      <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
        <h2>Unity WebRTC Stream</h2>
        
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => change_character("0")}>Character 1</button>
          <button onClick={() => change_character("1")}>Character 2</button>
        </div>
  
        <div style={{ marginBottom: 20 }}>
          <input 
            type="text" 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to Unity..."
            onKeyDown={(e) => e.key === 'Enter' && send_message()} 
            style={{ padding: '8px', width: '250px' }}
          />
          <button onClick={send_message} style={{ padding: '8px 16px', marginLeft: '5px' }}>
            Send
          </button>
        </div>
  
        <button 
          onClick={() => { if (videoRef.current) videoRef.current.muted = false; }}
          style={{ marginBottom: 10, padding: '8px 16px', display: 'block' }}
        >
          Allow Audio
        </button>
  
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", maxWidth: 600, background: "black", borderRadius: '8px' }}
        />
      </div>
    );
  }*/
  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        padding: 20,
        fontFamily: "sans-serif",
        height: "100vh",
        boxSizing: "border-box"
      }}
    >
      {/* left Container */}
      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          border: "1px solid lightgray",
          borderRadius: 8,
          padding: 16
        }}
      >
        <h2>Chat</h2>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid gray",
            borderRadius: 6,
            padding: 10,
            marginBottom: 10
          }}
        >
          {/* Chat Messages */}
        </div>

        <div style={{ display: "flex" }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && send_message()}
            style={{ padding: 8, flex: 1 }}
          />
          <button
            onClick={send_message}
            style={{ padding: "8px 16px", marginLeft: 8 }}
          >
            Send
          </button>
        </div>
      </div>

      {/* right Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          border: "1px solid lightgray",
          borderRadius: 8,
          padding: 16
        }}
      >

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 12
          }}
        >


          <h2 style={{ textAlign: "center" }}>Unity WebRTC Stream</h2>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "92%",
              aspectRatio: "5 / 5",
              objectFit: "cover",
              background: "black",
              borderRadius: 8,
              marginBottom: 12
            }}
          />
        </div>

        <button
          onClick={() => {
            if (videoRef.current) videoRef.current.muted = false;
          }}
          style={{ padding: "8px 16px", marginBottom: 12 }}
        >
          Allow Audio
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 14 }}>Character</label>

          <select
            onChange={(e) => change_character(e.target.value)}
            defaultValue="0"
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid gray"
            }}
          >
            <option value="0">Character 1</option>
            <option value="1">Character 2</option>
          </select>
        </div>

      </div>
    </div>
  );

}

export default App;
