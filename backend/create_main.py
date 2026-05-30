code = """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class Message(BaseModel):
    message: str

@app.get("/")
def root():
    return {"status": "SONA AI chal raha hai!"}

@app.post("/chat")
async def chat(msg: Message):
    res = client.chat.completions.create(model="llama3-70b-8192", messages=[{"role": "system", "content": "Tu SONA hai, Ashish Patel ne banaya hai. Hinglish mein baat kar."}, {"role": "user", "content": msg.message}])
    return {"reply": res.choices[0].message.content}
"""
with open("main.py", "w") as f:
    f.write(code)
print("Done!")