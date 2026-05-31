import { useState, useRef, useEffect } from "react"

const API = "https://sona-backend-oqid.onrender.com"

function Login({ onLogin }) {
  const [mode, setMode] = useState("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!username || !password) return setError("Sab fields bharo!")
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API}/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) return setError(data.detail || "Error aaya!")
      localStorage.setItem("token", data.token)
      localStorage.setItem("username", data.username)
      onLogin(data.username)
    } catch {
      setError("Server se connect nahi ho paya!")
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #000008, #000820)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ width: "360px", background: "rgba(0,20,60,0.9)", borderRadius: "20px", border: "1px solid rgba(0,100,255,0.3)", padding: "32px", boxShadow: "0 0 40px rgba(0,100,255,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "48px" }}>🤖</div>
          <h1 style={{ color: "#00c8ff", margin: "8px 0 4px", letterSpacing: "3px" }}>SONA AI</h1>
          <p style={{ color: "rgba(0,200,255,0.4)", fontSize: "12px", margin: 0 }}>BY ASHISH PATEL</p>
        </div>

        <div style={{ display: "flex", marginBottom: "24px", background: "rgba(0,0,0,0.3)", borderRadius: "10px", padding: "4px" }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "8px", border: "none", borderRadius: "8px", cursor: "pointer",
              background: mode === m ? "linear-gradient(135deg, #0050ff, #0080ff)" : "transparent",
              color: mode === m ? "white" : "rgba(255,255,255,0.4)", fontSize: "13px", fontWeight: "600"
            }}>
              {m === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <input value={username} onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          style={{ width: "100%", marginBottom: "12px", padding: "12px", background: "rgba(0,30,60,0.8)", border: "1px solid rgba(0,100,255,0.3)", borderRadius: "10px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
        />
        <input value={password} onChange={e => setPassword(e.target.value)}
          type="password" placeholder="Password"
          onKeyDown={e => e.key === "Enter" && submit()}
          style={{ width: "100%", marginBottom: "16px", padding: "12px", background: "rgba(0,30,60,0.8)", border: "1px solid rgba(0,100,255,0.3)", borderRadius: "10px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
        />

        {error && <p style={{ color: "#ff4444", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>{error}</p>}

        <button onClick={submit} disabled={loading} style={{
          width: "100%", padding: "12px", background: "linear-gradient(135deg, #0050ff, #0080ff)",
          border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "600",
          cursor: "pointer", letterSpacing: "2px", boxShadow: "0 4px 15px rgba(0,80,255,0.4)"
        }}>
          {loading ? "..." : mode === "login" ? "LOGIN" : "REGISTER"}
        </button>
      </div>
    </div>
  )
}

function Chat({ username, onLogout }) {
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
      const token = localStorage.getItem("token")
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "sona", text: data.reply }])
      iframeRef.current?.contentWindow?.postMessage({ type: "sona_reply", text: data.reply }, "*")
      const audio = new Audio(`${API}${data.audio}`)
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
    r.lang = "hi-IN"
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = (e) => sendMessage(e.results[0][0].transcript)
    r.onerror = () => setListening(false)
    r.start()
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #000008, #000820)", display: "flex", flexDirection: "column", fontFamily: "sans-serif", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "rgba(0,20,60,0.8)", borderBottom: "1px solid rgba(0,100,255,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #0050ff, #00c8ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🤖</div>
          <div>
            <div style={{ color: "#00c8ff", fontWeight: "700", fontSize: "18px", letterSpacing: "3px" }}>SONA AI</div>
            <div style={{ color: "rgba(0,200,255,0.4)", fontSize: "10px" }}>BY ASHISH PATEL</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "rgba(0,200,255,0.6)", fontSize: "13px" }}>👤 {username}</span>
          <button onClick={onLogout} style={{ background: "rgba(255,0,60,0.2)", border: "1px solid rgba(255,0,60,0.4)", borderRadius: "8px", padding: "6px 12px", color: "#ff003c", fontSize: "12px", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <iframe ref={iframeRef} src="/SONA_AI_animated_avatar.html" style={{ width: "100%", height: "100%", border: "none", minHeight: "500px" }} title="SONA Avatar" />
        </div>

        <div style={{ width: "min(360px, 100vw)", display: "flex", flexDirection: "column", background: "rgba(0,10,30,0.95)", borderLeft: "1px solid rgba(0,100,255,0.2)" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,100,255,0.15)" }}>
            <div style={{ color: "rgba(0,200,255,0.6)", fontSize: "10px", letterSpacing: "3px" }}>CONVERSATION</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(0,200,255,0.3)", fontSize: "13px", marginTop: "40px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>👋</div>
                Namaste {username}! SONA se baat karo!
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "linear-gradient(135deg, #0050ff, #0080ff)" : "rgba(0,40,80,0.8)",
                  border: msg.role === "sona" ? "1px solid rgba(0,100,255,0.3)" : "none",
                  color: "white", fontSize: "14px", lineHeight: "1.6"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: "6px", padding: "8px 0" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0080ff", opacity: 0.7 }} />
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: "14px", borderTop: "1px solid rgba(0,100,255,0.15)" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Message SONA..."
                style={{ flex: 1, background: "rgba(0,30,60,0.8)", border: "1px solid rgba(0,100,255,0.3)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }}
              />
              <button onClick={startListening} style={{
                background: listening ? "rgba(255,0,60,0.2)" : "rgba(0,80,255,0.2)",
                border: `1px solid ${listening ? "#ff003c" : "rgba(0,100,255,0.4)"}`,
                borderRadius: "10px", padding: "10px 12px", color: listening ? "#ff003c" : "#0080ff", fontSize: "18px", cursor: "pointer"
              }}>
                {listening ? "🔴" : "🎤"}
              </button>
            </div>
            <button onClick={() => sendMessage()} disabled={loading} style={{
              width: "100%", padding: "10px", background: "linear-gradient(135deg, #0050ff, #0080ff)",
              border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600",
              cursor: "pointer", letterSpacing: "2px", boxShadow: "0 4px 15px rgba(0,80,255,0.4)"
            }}>
              {loading ? "PROCESSING..." : "SEND ➤"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [username, setUsername] = useState(localStorage.getItem("username"))

  const handleLogin = (name) => setUsername(name)
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    setUsername(null)
  }

  return username ? <Chat username={username} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />
}