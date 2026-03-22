/**
 * ResultCard.jsx
 * Displays the AI detection result: category, confidence, probability bars,
 * highlighted toxic words, and a "Speak Result" button (uses browser TTS).
 */
import React from 'react';
import './ResultCard.css';

// Maps prediction label to UI config
const LABEL_CONFIG = {
  'hate speech': {
    emoji: '🚨',
    label: 'Hate Speech Detected',
    color: 'danger',
    message: 'Warning! This content contains hate speech and may be harmful.',
    ttsMessage: 'Warning! Hate speech has been detected in this content.',
    advice: '💡 Educational Note: Hate speech marginalizes and harms communities. Please use respectful and inclusive language.',
  },
  'offensive language': {
    emoji: '⚠️',
    label: 'Offensive Language',
    color: 'warning',
    message: 'This content contains offensive language.',
    ttsMessage: 'Caution! This content contains offensive language.',
    advice: '💡 Educational Note: Using offensive language can escalate conflicts. Consider rephrasing your thoughts constructively.',
  },
  'neutral': {
    emoji: '✅',
    label: 'Safe Content',
    color: 'success',
    message: 'This content appears to be safe and neutral.',
    ttsMessage: 'Content is safe. No harmful language detected.',
    advice: null,
  },
};

// Highlight toxic words in a text string
const TOXIC_WORDS = [
  'hate', 'kill', 'die', 'stupid', 'idiot', 'dumb', 'racist', 'nigger',
  'faggot', 'bitch', 'bastard', 'asshole', 'moron', 'retard', 'terrorist',
  'loser', 'freak', 'ugly', 'disgusting', 'trash',
];

function highlightToxicWords(text) {
  if (!text) return null;
  const words = text.split(/(\s+)/);
  return words.map((word, i) => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (TOXIC_WORDS.includes(clean)) {
      return (
        <mark key={i} className="toxic-highlight">
          {word}
        </mark>
      );
    }
    return <span key={i}>{word}</span>;
  });
}

function censorToxicWords(text) {
  if (!text) return null;
  const words = text.split(/(\s+)/);
  return words.map(word => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (TOXIC_WORDS.includes(clean)) {
      let firstSeen = false;
      return word.replace(/[a-zA-Z]/g, char => {
        if (!firstSeen) { firstSeen = true; return char; }
        return '*';
      });
    }
    return word;
  }).join('');
}

// Speak the verdict aloud using the browser's Speech Synthesis API
function speakResult(text) {
  if (!window.speechSynthesis) {
    alert('Text-to-speech is not supported in your browser.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export default function ResultCard({ result, inputText }) {
  if (!result) return null;

  const predKey = result.prediction?.toLowerCase() || 'neutral';
  const config = LABEL_CONFIG[predKey] || LABEL_CONFIG['neutral'];
  const confidence = Math.round((result.confidence || 0) * 100);

  // Build probability rows from result.probabilities object
  const probEntries = result.probabilities
    ? Object.entries(result.probabilities)
    : [];

  return (
    <div className={`result-card result-card--${config.color}`}>
      {/* Header */}
      <div className="result-header">
        <span className="result-emoji">{config.emoji}</span>
        <div>
          <h3 className="result-label">{config.label}</h3>
          <p className="result-sublabel">{config.message}</p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="confidence-section">
        <div className="confidence-label">
          <span>Confidence</span>
          <span className="confidence-pct">{confidence}%</span>
        </div>
        <div className="confidence-bar-track">
          <div
            className={`confidence-bar-fill confidence-bar-fill--${config.color}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* Probability breakdown */}
      {probEntries.length > 0 && (
        <div className="prob-section">
          <h4 className="prob-title">Probability Breakdown</h4>
          {probEntries.map(([label, prob]) => {
            const pct = Math.round(prob * 100);
            const cfg = LABEL_CONFIG[label.toLowerCase()] || {};
            return (
              <div key={label} className="prob-row">
                <span className="prob-row-label">{cfg.label || label}</span>
                <div className="prob-row-bar-track">
                  <div
                    className={`prob-row-bar-fill prob-row-bar-fill--${cfg.color || 'neutral'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="prob-row-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Educational Advice */}
      {config.advice && (
        <div className="advice-section">
          <p className="advice-text">{config.advice}</p>
        </div>
      )}

      {/* Highlighted text */}
      {inputText && (
        <div className="highlight-section">
          <h4 className="highlight-title">Analyzed Text</h4>
          <p className="highlight-text">{highlightToxicWords(inputText)}</p>
        </div>
      )}

      {/* Safe Text Version (Only show if not neutral) */}
      {inputText && predKey !== 'neutral' && (
        <div className="safe-text-section">
          <h4 className="safe-text-title">🛡️ Safe Version</h4>
          <p className="safe-text-content">{censorToxicWords(inputText)}</p>
        </div>
      )}

      {/* Speak button */}
      <button
        className="speak-btn"
        onClick={() => speakResult(config.ttsMessage)}
        title="Hear the verdict aloud"
      >
        🔊 Speak Result
      </button>
    </div>
  );
}
