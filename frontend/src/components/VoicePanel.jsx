/**
 * VoicePanel.jsx
 * Right panel – user records a voice note using the browser MediaRecorder API.
 * The audio is sent to the backend (POST /predict-voice) which transcribes it
 * and returns the hate speech prediction.
 * The verdict is also spoken aloud via the browser Speech Synthesis API.
 */
import React, { useState, useRef } from 'react';
import { analyzeVoice } from '../api';
import ResultCard from './ResultCard';
import './Panel.css';

const STATE = { IDLE: 'idle', RECORDING: 'recording', PROCESSING: 'processing' };

export default function VoicePanel() {
  const [status, setStatus] = useState(STATE.IDLE);
  const [result, setResult] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [language, setLanguage] = useState('en-IN');

  const mediaRecorderRef = useRef(null);
  const chunksRef         = useRef([]);
  const timerRef          = useRef(null);

  // ── Start Recording ─────────────────────────────────
  const startRecording = async () => {
    setError('');
    setResult(null);
    setTranscription('');
    setSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = handleRecordingStop;
      recorder.start();
      setStatus(STATE.RECORDING);

      // Tick timer
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);

    } catch (err) {
      setError('🎤 Microphone access denied. Please allow microphone permissions in your browser.');
    }
  };

  // ── Stop Recording ───────────────────────────────────
  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setStatus(STATE.PROCESSING);
  };

  // ── Convert chunks to true PCM WAV ───────────────────
  const exportWav = async (chunks) => {
    const blob = new Blob(chunks);
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    const channels = [];
    for (let i = 0; i < numOfChan; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        let sample = Math.max(-1, Math.min(1, channels[channel][i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  // ── Handle Audio after recording stops ───────────────
  const handleRecordingStop = async () => {
    try {
      const audioBlob = await exportWav(chunksRef.current);
      const data = await analyzeVoice(audioBlob, language);
      setTranscription(data.transcribed_text || '');
      setResult(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(`⚠️ Server Error: ${detail}`);
      } else {
        setError('⚠️ Could not connect to backend. Make sure the Python server is running on port 8000.');
      }
    } finally {
      setStatus(STATE.IDLE);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="panel">
      {/* Panel header */}
      <div className="panel-header">
        <div className="panel-icon panel-icon--voice">🎤</div>
        <div>
          <h2 className="panel-title">Voice Analysis</h2>
          <p className="panel-subtitle">Record your voice – AI will detect hate speech</p>
        </div>
      </div>

      {/* Language Selector */}
      <div className="language-selector">
        <label htmlFor="voice-lang">Language: </label>
        <select 
          id="voice-lang" 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          disabled={status !== STATE.IDLE}
        >
          <option value="en-IN">English</option>
          <option value="te-IN">Telugu</option>
        </select>
      </div>

      {/* Visualizer / status area */}
      <div className={`voice-visualizer ${status === STATE.RECORDING ? 'voice-visualizer--active' : ''}`}>
        {status === STATE.IDLE && (
          <div className="voice-placeholder">
            <span className="voice-placeholder-icon">🎙️</span>
            <p>Press <strong>Start Recording</strong> and speak</p>
          </div>
        )}

        {status === STATE.RECORDING && (
          <div className="voice-recording-state">
            <div className="pulse-ring" />
            <span className="record-dot" />
            <span className="record-timer">{formatTime(seconds)}</span>
            <p className="record-label">Recording in progress…</p>
            {/* Animated bars */}
            <div className="audio-bars">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="audio-bar" style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          </div>
        )}

        {status === STATE.PROCESSING && (
          <div className="voice-processing-state">
            <span className="spinner spinner--large" />
            <p>Transcribing &amp; analyzing…</p>
          </div>
        )}
      </div>

      {/* Transcription display */}
      {transcription && (
        <div className="transcription-box">
          <span className="transcription-label">📝 Transcribed text:</span>
          <p className="transcription-text">"{transcription}"</p>
        </div>
      )}

      {/* Error */}
      {error && <p className="error-msg">{error}</p>}

      {/* Record / Stop button */}
      <button
        id="voice-record-btn"
        className={`primary-btn ${status === STATE.RECORDING ? 'primary-btn--danger' : ''} ${status === STATE.PROCESSING ? 'primary-btn--loading' : ''}`}
        onClick={status === STATE.RECORDING ? stopRecording : startRecording}
        disabled={status === STATE.PROCESSING}
      >
        {status === STATE.IDLE      && <>🎤 Start Recording</>}
        {status === STATE.RECORDING && <>⏹️ Stop Recording</>}
        {status === STATE.PROCESSING && (
          <>
            <span className="spinner" />
            Processing…
          </>
        )}
      </button>

      {/* Recording hint */}
      {status === STATE.IDLE && !result && (
        <p className="panel-hint">Speak clearly for best results. Recording stops when you click "Stop Recording".</p>
      )}

      {/* Result */}
      <ResultCard result={result} inputText={transcription} />
    </div>
  );
}
