"""
tts.py
Text-to-speech helper using pyttsx3 (offline, no API key needed).
Used optionally by the backend; the frontend also has its own browser TTS.
"""

import pyttsx3


def speak(text: str, rate: int = 175, volume: float = 1.0) -> None:
    """
    Speak the given text aloud using the system TTS engine.

    Args:
        text:   Text to read aloud.
        rate:   Words per minute (default 175).
        volume: Volume 0.0 – 1.0 (default 1.0).
    """
    try:
        engine = pyttsx3.init()
        engine.setProperty("rate",   rate)
        engine.setProperty("volume", volume)
        engine.say(text)
        engine.runAndWait()
        engine.stop()
    except Exception as e:
        # TTS is non-critical; log but don't crash the server
        print(f"[TTS] Warning: could not speak — {e}")


def get_verdict_message(prediction: str) -> str:
    """Return a human-friendly spoken verdict for the given prediction label."""
    mapping = {
        "hate speech":         "Warning! Hate speech has been detected in this content. Please be careful.",
        "offensive language":  "Caution! This content contains offensive language.",
        "neutral":             "Content is safe. No harmful language was detected.",
    }
    return mapping.get(prediction.lower(), "Analysis complete.")
