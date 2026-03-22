"""
voice.py
Speech-to-text conversion using the SpeechRecognition library.
Accepts an audio file (bytes/path) and returns the transcribed text.
"""

import io
import speech_recognition as sr


def audio_to_text(audio_bytes: bytes, language: str = "en-IN") -> str:
    """
    Convert raw audio bytes (WAV / WebM / OGG) to text.

    Args:
        audio_bytes: Raw audio content from the uploaded file.
        language: Language code to pass to Google Speech Recognition (default: "en-IN").

    Returns:
        Transcribed string, or raises ValueError if recognition fails.
    """
    recognizer = sr.Recognizer()

    # Wrap bytes in a file-like object
    audio_file = io.BytesIO(audio_bytes)

    try:
        with sr.AudioFile(audio_file) as source:
            # Adjust for ambient noise (short calibration)
            recognizer.adjust_for_ambient_noise(source, duration=0.3)
            audio_data = recognizer.record(source)

        # Use Google Web Speech API with the specified language
        text = recognizer.recognize_google(audio_data, language=language)
        return text

    except sr.UnknownValueError:
        raise ValueError("Could not understand audio. Please speak clearly, ensure your microphone is working, and try again.")
    except sr.RequestError as e:
        raise ValueError(f"Speech recognition service error: {e}")
    except Exception as e:
        raise ValueError(f"Audio processing error: {e}")
