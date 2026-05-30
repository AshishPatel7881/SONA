from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from gtts import gTTS
import os
import uuid

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://project-453x8.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class Message(BaseModel):
    message: str

@app.get("/")
def root():
    return {"status": "SONA AI chal raha hai!"}

@app.post("/chat")
async def chat(msg: Message):
    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "Tu SONA hai. Ashish Patel ne banaya hai tujhe. Bas itna yaad rakh."},
            {"role": "assistant", "content": "Haan! Main SONA hoon, Ashish Patel ki personal AI assistant. Main unhi ki banai hui hoon!"},
            {"role": "user", "content": "Kisne banaya hai tujhe?"},
            {"role": "assistant", "content": "Mujhe Ashish Patel ne banaya hai! Main SONA hoon, unki personal AI assistant."},
            {"role": "user", "content": msg.message}
        ]
    )
    reply = res.choices[0].message.content

    # gTTS se audio banao
    filename = f"audio_{uuid.uuid4().hex}.mp3"
    filepath = f"audio/{filename}"
    os.makedirs("audio", exist_ok=True)
    tts = gTTS(text=reply, lang="en", slow=False)
    tts.save(filepath)

    return {"reply": reply, "audio": f"/audio/{filename}"}

@app.get("/audio/{filename}")
def get_audio(filename: str):
    return FileResponse(f"audio/{filename}", media_type="audio/mpeg")