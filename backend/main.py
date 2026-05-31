from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from gtts import gTTS
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import uuid
from datetime import datetime

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

# Database setup
engine = create_engine("sqlite:///sona_chat.db")
Base = declarative_base()

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True)
    user_message = Column(Text)
    sona_reply = Column(Text)
    timestamp = Column(DateTime, default=datetime.now)

Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

class Message(BaseModel):
    message: str

@app.get("/")
def root():
    return {"status": "SONA AI chal raha hai!"}

@app.post("/chat")
async def chat(msg: Message):
    session = Session()
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

    # Save to database
    chat = ChatHistory(user_message=msg.message, sona_reply=reply)
    session.add(chat)
    session.commit()
    session.close()

    # gTTS audio
    filename = f"audio_{uuid.uuid4().hex}.mp3"
    filepath = f"audio/{filename}"
    os.makedirs("audio", exist_ok=True)
    tts = gTTS(text=reply, lang="hi", slow=False)
    tts.save(filepath)

    return {"reply": reply, "audio": f"/audio/{filename}"}

@app.get("/history")
def get_history():
    session = Session()
    chats = session.query(ChatHistory).order_by(ChatHistory.timestamp.desc()).limit(50).all()
    session.close()
    return [{"user": c.user_message, "sona": c.sona_reply, "time": str(c.timestamp)} for c in chats]

@app.get("/audio/{filename}")
def get_audio(filename: str):
    return FileResponse(f"audio/{filename}", media_type="audio/mpeg")