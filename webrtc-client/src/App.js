import { useEffect, useRef, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  Typography
} from "@mui/material";
import { ChromePicker } from "react-color";

function App() {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(new MediaStream());

  const [inputText, setInputText] = useState("");
  const [bgColor, setBgColor] = useState("#000000");

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
    <Box
      sx={{
        display: "flex",
        gap: 2.5,              // ≈ 20px
        p: 2.5,
        height: "100vh",
        boxSizing: "border-box"
      }}
    >
      {/* left Card Container */}
      <Card
        sx={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          borderRadius: 1
        }}
        variant="outlined"
      >
        <CardContent
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 2
          }}
        >
          <Typography variant="h6">Chat</Typography>

          <Box
            sx={{
              flex: 1,
              border: "1px solid",
              borderColor: "grey.500",
              borderRadius: 1,
              p: 1.25,
              overflowY: "auto"
            }}
          >
            {/* Chat Messages */}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send_message()}
            />
            <Button variant="contained" onClick={send_message}>
              Send
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* right Card Container */}
      <Card
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: 1
        }}
        variant="outlined"
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 1.5
            }}
          >
            <Typography variant="h6" align="center">
              Unity WebRTC Stream
            </Typography>

            <Box
              sx={{
                width: "92%",
                aspectRatio: "1 / 1",
                bgcolor: "black",
                borderRadius: 1,
                overflow: "hidden",
                mt: 1.5
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            </Box>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            sx={{ mb: 1.5 }}
            onClick={() => {
              if (videoRef.current) videoRef.current.muted = false;
            }}
          >
            Allow Audio
          </Button>

          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Character
          </Typography>

          <Select
            fullWidth
            size="small"
            defaultValue="0"
            onChange={(e) => change_character(e.target.value)}
          >
            <MenuItem value="0">Character 1</MenuItem>
            <MenuItem value="1">Character 2</MenuItem>
          </Select>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Background Color
            </Typography>

            <ChromePicker
              color={bgColor}
              onChange={(color) => setBgColor(color.hex)}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

}

export default App;
