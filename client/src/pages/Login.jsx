import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cat } from '../components/Cat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cat State & Position tracking
  const [catState, setCatState] = useState('entering'); // entering, idle, following, email, password, error, success
  const [catPos, setCatPos] = useState({ x: -200, y: -200 });
  const [targetPos, setTargetPos] = useState({ x: -200, y: -200 });
  const [facing, setFacing] = useState('right');
  const [isWalking, setIsWalking] = useState(false);
  const [isBehindCard, setIsBehindCard] = useState(true);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Element Refs for positioning
  const cardRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Animation frame & state refs to prevent stale closures
  const catPosRef = useRef(catPos);
  const targetPosRef = useRef(targetPos);
  const catStateRef = useRef(catState);
  const animFrameRef = useRef(null);
  const isMobileRef = useRef(window.innerWidth <= 600);

  // Keep refs in sync with state
  catPosRef.current = catPos;
  targetPosRef.current = targetPos;
  catStateRef.current = catState;

  // Cat dimensions
  const catWidth = isMobileRef.current ? 70 : 95;
  const catHeight = isMobileRef.current ? 78 : 105;

  // 1. Initial Entrance Animation: Pop up from behind Card
  useEffect(() => {
    const handleResize = () => {
      isMobileRef.current = window.innerWidth <= 600;
    };
    window.addEventListener('resize', handleResize);

    const timer1 = setTimeout(() => {
      if (cardRef.current) {
        const cardRect = cardRef.current.getBoundingClientRect();
        // Start hidden behind top edge of card
        const startX = cardRect.left + cardRect.width / 2 - catWidth / 2;
        const startY = cardRect.top + 15;
        
        setCatPos({ x: startX, y: startY });
        setTargetPos({ x: startX, y: startY });
        setIsBehindCard(true);

        // Pop up to sit on top edge of card
        setTimeout(() => {
          const topY = cardRect.top - catHeight + 14;
          setTargetPos({ x: startX, y: topY });
          setIsBehindCard(false);

          setTimeout(() => {
            setCatState('idle');
          }, 700);
        }, 350);
      }
    }, 150);

    return () => {
      clearTimeout(timer1);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 2. Mouse Movement Tracking for Cursor Following (Desktop only)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isMobileRef.current) return;
      
      const currentState = catStateRef.current;
      // Only follow cursor if in idle or following state
      if (currentState === 'idle' || currentState === 'following') {
        const cursorX = e.clientX;
        const cursorY = e.clientY;

        let targetX = cursorX - catWidth / 2;
        let targetY = cursorY - catHeight / 2;

        // Keep-out box check: avoid covering the login card inputs
        if (cardRef.current) {
          const cardRect = cardRef.current.getBoundingClientRect();
          // If cursor is directly over form area, offset cat to card side
          if (
            cursorX >= cardRect.left &&
            cursorX <= cardRect.right &&
            cursorY >= cardRect.top &&
            cursorY <= cardRect.bottom
          ) {
            targetX = cursorX > (cardRect.left + cardRect.width / 2)
              ? cardRect.right + 10
              : cardRect.left - catWidth - 10;
          }
        }

        // Keep within window bounds
        targetX = Math.max(10, Math.min(window.innerWidth - catWidth - 10, targetX));
        targetY = Math.max(10, Math.min(window.innerHeight - catHeight - 10, targetY));

        setTargetPos({ x: targetX, y: targetY });

        if (currentState !== 'following') {
          setCatState('following');
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 3. Smooth Lerp Motion Loop (requestAnimationFrame)
  useEffect(() => {
    let lastTime = performance.now();

    const updatePosition = (now) => {
      const current = catPosRef.current;
      const target = targetPosRef.current;

      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.5) {
        const speed = 0.08; // Smooth linear interpolation speed
        const nextX = current.x + dx * speed;
        const nextY = current.y + dy * speed;

        setCatPos({ x: nextX, y: nextY });

        // Update direction & walking state
        if (Math.abs(dx) > 0.8) {
          setFacing(dx > 0 ? 'right' : 'left');
        }
        setIsWalking(dist > 2.5);
      } else {
        setIsWalking(false);
        // If reached target during following, return to idle
        if (catStateRef.current === 'following' && dist <= 1) {
          setCatState('idle');
        }
      }

      animFrameRef.current = requestAnimationFrame(updatePosition);
    };

    animFrameRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Field Focus Handlers
  const handleEmailFocus = () => {
    setCatState('email');
    setIsBehindCard(false);
    if (emailRef.current) {
      const emailRect = emailRef.current.getBoundingClientRect();
      const isNarrow = window.innerWidth <= 768;
      
      const posX = isNarrow 
        ? emailRect.right - catWidth - 10 
        : emailRect.right + 12;
      const posY = emailRect.top + (emailRect.height / 2) - (catHeight / 2);

      setTargetPos({ x: posX, y: posY });
      setFacing(isNarrow ? 'right' : 'left');
    }
  };

  const handlePasswordFocus = () => {
    setCatState('password');
    setIsBehindCard(false);
    if (passwordRef.current) {
      const passwordRect = passwordRef.current.getBoundingClientRect();
      const isNarrow = window.innerWidth <= 768;

      const posX = isNarrow 
        ? passwordRect.right - catWidth - 10 
        : passwordRect.right + 12;
      const posY = passwordRect.top + (passwordRect.height / 2) - (catHeight / 2);

      setTargetPos({ x: posX, y: posY });
      setFacing(isNarrow ? 'right' : 'left');
    }
  };

  const handleBlur = () => {
    // Smoothly return to top edge of login card when input loses focus
    if (!errorMsg) {
      if (cardRef.current) {
        const cardRect = cardRef.current.getBoundingClientRect();
        const topX = cardRect.left + cardRect.width / 2 - catWidth / 2;
        const topY = cardRect.top - catHeight + 14;

        setTargetPos({ x: topX, y: topY });
        setCatState('idle');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMsg('Please enter both email and password.');
      setCatState('error');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Exact backend messages:
        // "You're not registered yet. Please create an account first."
        // "Incorrect password. Please try again."
        setErrorMsg(data.message || 'Login failed. Please verify your credentials.');
        setCatState('error');
        
        if (cardRef.current) {
          const cardRect = cardRef.current.getBoundingClientRect();
          setTargetPos({ 
            x: cardRect.right - catWidth + 10, 
            y: cardRect.top - catHeight + 14 
          });
        }
      } else {
        setCatState('success');
        if (cardRef.current) {
          const cardRect = cardRef.current.getBoundingClientRect();
          setTargetPos({ 
            x: cardRect.left + cardRect.width / 2 - catWidth / 2, 
            y: cardRect.top - catHeight + 14 
          });
        }
        
        login(data.token, data.user);
        setTimeout(() => {
          navigate('/home');
        }, 800);
      }
    } catch (err) {
      console.error('Login fetch error:', err);
      setErrorMsg('Unable to connect to the server. Please check backend API.');
      setCatState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-centered-container">
      {/* 🐾 Interactive Companion Cat Character */}
      <Cat 
        position={catPos}
        state={catState}
        facing={facing}
        isWalking={isWalking}
        isBehindCard={isBehindCard}
      />

      {/* 💳 Floating Centered Login Card */}
      <div className="auth-card" ref={cardRef}>
        <div className="auth-header">
          <span className="auth-welcome-pill">WELCOME BACK</span>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your cozy account</p>
        </div>

        {errorMsg && (
          <div className="alert-box alert-error">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              onFocus={handleEmailFocus}
              onBlur={handleBlur}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              ref={passwordRef}
              id="login-password"
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              onFocus={handlePasswordFocus}
              onBlur={handleBlur}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In 🐾'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create One</Link>
        </div>
      </div>
    </div>
  );
};
