import { useState, useRef, useEffect } from "react"

function App() {
  const iframeRef = useRef(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [messages, setMessages] = useState([])

  const sendMessage = async (text) => {
    const userMsg = text || input
    if (!userMsg.trim()) return
    setInput("")
    setLoading(true)
    setMessages(prev => [...prev, { role: "user", text: userMsg }])
    iframeRef.current?.contentWindow?.postMessage({ type: "user_msg", text: userMsg }, "*")

    try {
      const res = await fetch("https://sona-backend-oqid.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "sona", text: data.reply }])
      iframeRef.current?.contentWindow?.postMessage({ type: "sona_reply", text: data.reply }, "*")
      const audio = new Audio(`https://sona-backend-oqid.onrender.com${data.audio}`)
      audio.play()
    } catch {
      setMessages(prev => [...prev, { role: "sona", text: "Backend se connect nahi ho paya!" }])
    }
    setLoading(false)
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert("Chrome use karo!")
    const r = new SR()
    r.lang = "en-US"
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = (e) => sendMessage(e.results[0][0].transcript)
    r.onerror = (e) => { setListening(false) }
    r.start()
  }

  return (
    <div style={{
      minHeight: "100vh", height: "100vh",
      background: "linear-gradient(135deg, #000008 0%, #000820 50%, #000510 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Segoe UI', sans-serif",
      overflow: "hidden"
    }}>

      {/* Top Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        background: "rgba(0,20,60,0.8)",
        borderBottom: "1px solid rgba(0,100,255,0.2)",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "linear-gradient(135deg, #0050ff, #00c8ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", boxShadow: "0 0 15px rgba(0,100,255,0.5)"
          }}>🤖</div>
          <div>
            <div style={{ color: "#00c8ff", fontWeight: "700", fontSize: "18px", letterSpacing: "3px" }}>SONA AI</div>
            <div style={{ color: "rgba(0,200,255,0.4)", fontSize: "10px", letterSpacing: "2px" }}>BY ASHISH PATEL</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#00ff88", fontSize: "11px", letterSpacing: "1px" }}>ONLINE</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Avatar - Left Full */}
        <div style={{ flex: 1, position: "relative" }}>
          <iframe
            ref={iframeRef}
            src="/SONA_AI_animated_avatar.html"
            style={{ width: "100%", height: "100%", border: "none", minHeight: "600px" }}
            title="SONA Avatar"
          />
        </div>

        {/* Chat Panel - Right */}
        <div style={{
          width: "360px",
          display: "flex",
          flexDirection: "column",
          background: "rgba(0,10,30,0.95)",
          borderLeft: "1px solid rgba(0,100,255,0.2)",
        }}>

          {/* Chat Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,100,255,0.15)" }}>
            <div style={{ color: "rgba(0,200,255,0.6)", fontSize: "10px", letterSpacing: "3px" }}>CONVERSATION</div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(0,200,255,0.3)", fontSize: "13px", marginTop: "40px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>👋</div>
                SONA se baat karo!
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #0050ff, #0080ff)"
                    : "rgba(0,40,80,0.8)",
                  border: msg.role === "sona" ? "1px solid rgba(0,100,255,0.3)" : "none",
                  color: "white", fontSize: "14px", lineHeight: "1.6",
                  boxShadow: msg.role === "user" ? "0 4px 15px rgba(0,80,255,0.3)" : "0 4px 15px rgba(0,0,0,0.3)"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: "6px", padding: "8px 0" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#0080ff", opacity: 0.7,
                    animation: `bounce 1s infinite ${i * 0.2}s`
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "14px", borderTop: "1px solid rgba(0,100,255,0.15)" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Message SONA..."
                style={{
                  flex: 1, background: "rgba(0,30,60,0.8)",
                  border: "1px solid rgba(0,100,255,0.3)", borderRadius: "10px",
                  padding: "10px 14px", color: "white", fontSize: "14px", outline: "none"
                }}
              />
              <button onClick={startListening} style={{
                background: listening ? "rgba(255,0,60,0.2)" : "rgba(0,80,255,0.2)",
                border: `1px solid ${listening ? "#ff003c" : "rgba(0,100,255,0.4)"}`,
                borderRadius: "10px", padding: "10px 12px",
                color: listening ? "#ff003c" : "#0080ff", fontSize: "18px", cursor: "pointer"
              }}>
                {listening ? "🔴" : "🎤"}
              </button>
            </div>
            <button onClick={() => sendMessage()} disabled={loading} style={{
              width: "100%", padding: "10px",
              background: "linear-gradient(135deg, #0050ff, #0080ff)",
              border: "none", borderRadius: "10px",
              color: "white", fontSize: "14px", fontWeight: "600",
              cursor: "pointer", letterSpacing: "2px",
              boxShadow: "0 4px 15px rgba(0,80,255,0.4)"
            }}>
              {loading ? "PROCESSING..." : "SEND ➤"}
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(0,100,255,0.3);border-radius:2px}
        input::placeholder{color:rgba(255,255,255,0.25)}
      `}</style>

    </div>
  )
}

export default App