import React from 'react';
import './Cat.css';

export const Cat = ({ 
  position = { x: 0, y: 0 }, 
  state = 'idle', 
  facing = 'right', 
  isWalking = false,
  isBehindCard = false
}) => {
  return (
    <div 
      className={`cat-fixed-container state-${state} facing-${facing} ${isWalking ? 'is-walking' : ''} ${isBehindCard ? 'behind-card' : 'front-card'}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`
      }}
    >
      <div className="cat-character-wrapper">
        {/* Cat Image */}
        <img 
          src="/cat.png" 
          alt="Tiny Interactive Cat Companion" 
          className="cat-character-img"
        />

        {/* Dynamic Expressions & Overlays */}

        {/* Password Focus: Closed Eyes + Shy Paws + Blush */}
        {state === 'password' && (
          <div className="cat-expression-overlay">
            <div className="cat-blush blush-left"></div>
            <div className="cat-blush blush-right"></div>
            
            {/* Closed Eyes SVG Arc */}
            <svg className="cat-closed-eyes-svg" viewBox="0 0 100 50">
              <path d="M 28 28 Q 38 16 48 28" fill="none" stroke="#5c3a21" strokeWidth="4" strokeLinecap="round" />
              <path d="M 52 28 Q 62 16 72 28" fill="none" stroke="#5c3a21" strokeWidth="4" strokeLinecap="round" />
            </svg>

            {/* Cute Paws over eyes */}
            <div className="cat-paw-cover paw-l">🐾</div>
            <div className="cat-paw-cover paw-r">🐾</div>

            <div className="cat-speech-bubble">No peeking! 🙈</div>
          </div>
        )}

        {/* Email Focus: Watching typing */}
        {state === 'email' && (
          <div className="cat-expression-overlay">
            <div className="cat-blush blush-left" style={{ opacity: 0.7 }}></div>
            <div className="cat-blush blush-right" style={{ opacity: 0.7 }}></div>
            <div className="cat-speech-bubble">Watching email 👀</div>
          </div>
        )}

        {/* Error State: Worried reaction */}
        {state === 'error' && (
          <div className="cat-expression-overlay">
            <div className="cat-sweat-drop">💧</div>
            <div className="cat-speech-bubble error-bubble">Oh no! 🙀</div>
          </div>
        )}

        {/* Success State: Happy bounce & hearts */}
        {state === 'success' && (
          <div className="cat-expression-overlay">
            <div className="cat-heart heart-1">💖</div>
            <div className="cat-heart heart-2">💕</div>
            <div className="cat-speech-bubble success-bubble">Yay! Welcome! 😸</div>
          </div>
        )}
      </div>
    </div>
  );
};
