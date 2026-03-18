/**
 * api.js
 * Axios helper to communicate with the FastAPI backend.
 * Backend is expected to run at http://localhost:8000
 */
import axios from 'axios';

// Use environment variable for production, fallback to public localtunnel URL
const API_URL = import.meta.env.VITE_API_URL || 'https://plenty-schools-watch.loca.lt';

/**
 * Send raw text to the backend for hate speech analysis.
 * @param {string} text - The text to analyze.
 * @returns {Promise<{prediction: string, confidence: number, probabilities: object}>}
 */
export const analyzeText = async (text) => {
  const response = await axios.post(`${API_URL}/predict-text`, { text });
  return response.data;
};

/**
 * Send an audio file (Blob) to the backend for voice-based hate speech detection.
 * Backend converts it to text first, then predicts.
 * @param {Blob} audioBlob - The recorded audio blob.
 * @returns {Promise<{transcribed_text: string, prediction: string, confidence: number}>}
 */
export const analyzeVoice = async (audioBlob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  const response = await axios.post(`${API_URL}/predict-voice`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
