

"""
main.py
FastAPI backend for the Hate Speech Detection System.

Endpoints:
  POST /predict-text   – Analyze typed text
  POST /predict-voice  – Analyze uploaded audio (speech → text → predict)
  GET  /health         – Server health check
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model import predict
from voice import audio_to_text
from tts   import get_verdict_message

# ── App setup ─────────────────────────────────────────────────────────
app = FastAPI(
    title="Hate Speech Detection API",
    description="Detect hate speech, offensive language, or safe content from text or voice.",
    version="1.0.0",
)

# Allow requests from the React frontend (localhost:3000)
# NOTE: allow_credentials cannot be True when allow_origins contains "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response models ──────────────────────────────────────────
class TextRequest(BaseModel):
    text: str

class TextResponse(BaseModel):
    prediction:    str
    confidence:    float
    probabilities: dict
    verdict_message: str

class VoiceResponse(BaseModel):
    transcribed_text: str
    prediction:       str
    confidence:       float
    probabilities:    dict
    verdict_message:  str


# ── Routes ────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Quick health check to confirm the server is running."""
    return {"status": "ok", "message": "Hate Speech Detection API is running!"}


@app.post("/predict-text", response_model=TextResponse)
def predict_text(request: TextRequest):
    """
    Analyze submitted text for hate speech.

    Body JSON: { "text": "your text here" }
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    result = predict(request.text)
    result["verdict_message"] = get_verdict_message(result["prediction"])
    return result


@app.post("/predict-voice", response_model=VoiceResponse)
async def predict_voice(file: UploadFile = File(...)):
    """
    Accept an audio file, transcribe it, then detect hate speech.

    Form field: file (audio/wav, audio/webm, audio/ogg …)
    """
    # Read uploaded audio bytes
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

    # Speech → text
    try:
        transcribed_text = audio_to_text(audio_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not transcribed_text.strip():
        raise HTTPException(status_code=422, detail="Could not detect any speech in the audio.")

    # Text → prediction
    result = predict(transcribed_text)
    result["verdict_message"]  = get_verdict_message(result["prediction"])
    result["transcribed_text"] = transcribed_text

    return result
