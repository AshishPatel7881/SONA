from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from gtts import gTTS
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from jose import jwt
import hashlib
import os
import uuid
from datetime import datetime, timedelta

load_dotenv()
app = FastAPI()

@app.middleware("http")
async def add_cors_header(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
SECRET_KEY = os.getenv("SECRET_KEY", "sona-secret-key-2024")
security = HTTPBearer(auto_error=False)

engine = create_engine("sqlite:////tmp/sona_chat_v2.db")
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password = Column(String)

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True)
    username = Column(String)
    user_message = Column(Text)
    sona_reply = Column(Text)
    timestamp = Column(DateTime, default=datetime.now)

Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

class Message(BaseModel):
    message: str

class UserLogin(BaseModel):
    username: str
    password: str

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(username):
    return jwt.encode({"sub": username, "exp": datetime.utcnow() + timedelta(days=7)}, SECRET_KEY, algorithm="HS256")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except:
        return None

@app.get("/")
def root():
    return {"status": "SONA AI chal raha hai!"}

@app.options("/{path:path}")
async def options_handler(path: str):
    return Response(headers={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Allow-Headers": "*"})

@app.post("/register")
def register(user: UserLogin):
    session = Session()
    if session.query(User).filter_by(username=user.username).first():
        session.close()
        raise HTTPException(status_code=400, detail="User already exists!")
    session.add(User(username=user.username, password=hash_password(user.password)))
    session.commit()
    session.close()
    return {"token": create_token(user.username), "username": user.username}

@app.post("/login")
def login(user: UserLogin):
    session = Session()
    db_user = session.query(User).filter_by(username=user.username).first()
    session.close()
    if not db_user or db_user.password != hash_password(user.password):
        raise HTTPException(status_code=401, detail="Galat username ya password!")
    return {"token": create_token(user.username), "username": user.username}

@app.post("/chat")
async def chat(msg: Message, username: str = Depends(get_current_user)):
    session = Session()
    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "Tu SONA hai. Ashish Patel ne banaya hai. Short Hinglish mein baat kar."},
            {"role": "user", "content": msg.message}
        ]
    )
    reply = res.choices[0].message.content
    chat = ChatHistory(username=username or "guest", user_message=msg.message, sona_reply=reply)
    session.add(chat)
    session.commit()
    session.close()
    filename = f"audio_{uuid.uuid4().hex}.mp3"
    os.makedirs("audio", exist_ok=True)
    tts = gTTS(text=reply, lang="hi", slow=False)
    tts.save(f"audio/{filename}")
    return {"reply": reply, "audio": f"/audio/{filename}"}

@app.get("/history")
def get_history(username: str = Depends(get_current_user)):
    session = Session()
    chats = session.query(ChatHistory).filter_by(username=username or "guest").order_by(ChatHistory.timestamp.desc()).limit(50).all()
    session.close()
    return [{"user": c.user_message, "sona": c.sona_reply, "time": str(c.timestamp)} for c in chats]

@app.get("/audio/{filename}")
def get_audio(filename: str):
    return FileResponse(f"audio/{filename}", media_type="audio/mpeg")
