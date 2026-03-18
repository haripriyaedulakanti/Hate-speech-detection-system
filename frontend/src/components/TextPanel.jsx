/**
 * TextPanel.jsx
 * Left panel – user types text and clicks "Analyze".
 * Sends text to the backend, shows ResultCard on response.
 */
import React, { useState } from 'react';
import { analyzeText } from '../api';
import ResultCard from './ResultCard';
import './Panel.css';

// Example placeholder texts to demo the system
const EXAMPLES = [
  'I love meeting new people from all walks of life.',
  'You are so stupid and worthless!',
  'All people of that religion should be eliminated.',
];

export default function TextPanel() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeText(text.trim());
      setResult(data);
      // Save to history (keep last 5)
      setHistory(prev => [{ text: text.trim(), result: data, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
    } catch (err) {
      setError('⚠️ Could not connect to backend. Make sure the Python server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      {/* Panel header */}
      <div className="panel-header">
        <div className="panel-icon panel-icon--text">💬</div>
        <div>
          <h2 className="panel-title">Text Analysis</h2>
          <p className="panel-subtitle">Type or paste any text to detect hate speech</p>
        </div>
      </div>

      {/* Textarea */}
      <div className="input-group">
        <textarea
          id="text-input"
          className="text-input"
          rows={5}
          placeholder="Type or paste text here... (e.g. 'I love all people' or try the examples below)"
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAnalyze(); }}
        />
        <span className="char-count">{text.length} characters</span>
      </div>

      {/* Example buttons */}
      <div className="examples-row">
        <span className="examples-label">Try an example:</span>
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            className="example-chip"
            onClick={() => { setText(ex); setResult(null); setError(''); }}
          >
            Example {i + 1}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <p className="error-msg">{error}</p>}

      {/* Analyze button */}
      <button
        id="analyze-text-btn"
        className={`primary-btn ${loading ? 'primary-btn--loading' : ''}`}
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Analyzing…
          </>
        ) : (
          <>🔍 Analyze Text</>
        )}
      </button>

      {/* Result */}
      <ResultCard result={result} inputText={text} />

      {/* History */}
      {history.length > 0 && (
        <div className="history-section">
          <h4 className="history-title">Recent Checks</h4>
          {history.map((item, i) => (
            <div key={i} className="history-item" onClick={() => { setText(item.text); setResult(item.result); }}>
              <span className="history-text">{item.text.substring(0, 50)}{item.text.length > 50 ? '…' : ''}</span>
              <span className="history-badge history-badge--text">{item.result?.prediction}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
