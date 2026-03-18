/**
 * App.jsx
 * Main application shell.
 * Layout:
 *   - Header with title & description
 *   - Two-column grid: TextPanel (left) | VoicePanel (right)
 *   - Footer
 */
import React from 'react';
import TextPanel from './components/TextPanel';
import VoicePanel from './components/VoicePanel';
import './App.css';

export default function App() {
  return (
    <div className="app">
      {/* ── Header ────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-badge">AI Powered</div>
          <h1 className="header-title">
            Hate Speech <span className="header-title-accent">Detection</span> System
          </h1>
          <p className="header-desc">
            Analyze text or voice in real-time. Detect hate speech, offensive language, or safe content using machine learning.
          </p>
          {/* Stats row */}
          <div className="header-stats">
            {[
              { icon: '🧠', label: 'ML Powered', sub: 'TF-IDF + Logistic Regression' },
              { icon: '🎤', label: 'Voice Support', sub: 'Record & Analyze' },
              { icon: '🔊', label: 'Audio Feedback', sub: 'Hear the verdict aloud' },
            ].map((s, i) => (
              <div key={i} className="stat-chip">
                <span>{s.icon}</span>
                <div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Two-Panel Layout ─────────────── */}
      <main className="app-main">
        <div className="panels-grid">
          <TextPanel />
          <VoicePanel />
        </div>


      </main>

      {/* ── Footer ────────────────────────────── */}
      <footer className="app-footer">
        <p>Hate Speech Detection System &nbsp;·&nbsp; Built with React + FastAPI + Scikit-Learn</p>
      </footer>
    </div>
  );
}
