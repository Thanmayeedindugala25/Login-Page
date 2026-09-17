import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cat } from '../components/Cat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cat state & positioning
  const [catState, setCatState] = useState('entering');
  const [catPos, setCatPos] = useState({ x: -200, y: -200 });
  const [targetPos, setTargetPos] = useState({ x: -200, y: -200 });
  const [facing, setFacing] = useState('right');
  const [isWalking, setIsWalking] = useState(false);
  const [isBehindCard, setIsBehindCard] = useState(true);

  const navigate = useNavigate();

  const cardRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const catPosRef = useRef(catPos);
  const targetPosRef = useRef(targetPos);
  const catStateRef = useRef(catState);
  const animFrameRef = useRef(null);
  const isMobileRef = useRef(window.innerWidth <= 600);

  catPosRef.current = catPos;
  targetPosRef.current = targetPos;
  catStateRef.current = catState;

  const catWidth = isMobileRef.current ? 70 : 95;
  const catHeight = isMobileRef.current ? 78 : 105;

  // Entrance pop-up animation
  useEffect(() => {
    const handleResize = () => {
      isMobileRef.current = window.innerWidth <= 600;
    };
    window.addEventListener('resize', handleResize);

    const timer = setTimeout(() => {
      if (cardRef.current) {
        const cardRect = cardRef.current.getBoundingClientRect();
        const startX = cardRect.left + cardRect.width / 2 - catWidth / 2;
        const startY = cardRect.top + 15;

        setCatPos({ x: startX, y: startY });
        setTargetPos({ x: startX, y: startY });
        setIsBehindCard(true);

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
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Smooth Motion Loop
  useEffect(() => {
    const updatePosition = () => {
      const current = catPosRef.current;
      const target = targetPosRef.current;

      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.5) {
        const speed = 0.08;
        const nextX = current.x + dx * speed;
        const nextY = current.y + dy * speed;

        setCatPos({ x: nextX, y: nextY });

        if (Math.abs(dx) > 0.8) {
          setFacing(dx > 0 ? 'right' : 'left');
        }
        setIsWalking(dist > 2.5);
      } else {
        setIsWalking(false);
      }

      animFrameRef.current = requestAnimationFrame(updatePosition);
    };

    animFrameRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Focus Handlers
  const handleInputFocus = (field, ref) => {
    if (field === 'password') {
      setCatState('password');
    } else {
      setCatState('email');
    }
    setIsBehindCard(false);

    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const isNarrow = window.innerWidth <= 768;

      const posX = isNarrow 
        ? rect.right - catWidth - 10 
        : rect.right + 12;
      const posY = rect.top + (rect.height / 2) - (catHeight / 2);

      setTargetPos({ x: posX, y: posY });
      setFacing(isNarrow ? 'right' : 'left');
    }
  };

  const handleBlur = () => {
    if (!errorMsg && !successMsg && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const topX = cardRect.left + cardRect.width / 2 - catWidth / 2;
      const topY = cardRect.top - catHeight + 14;

      setTargetPos({ x: topX, y: topY });
      setCatState('idle');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setErrorMsg('Name is required.');
      setCatState('error');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      setCatState('error');
      return false;
    }
    if (formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      setCatState('error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
        setCatState('error');
      } else {
        setSuccessMsg(data.message || 'Account created successfully. Please login.');
        setCatState('success');
        setTimeout(() => {
          navigate('/login');
        }, 1800);
      }
    } catch (err) {
      console.error('Registration fetch error:', err);
      setErrorMsg('Unable to connect to the server. Please check backend API.');
      setCatState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-centered-container">
      <Cat 
        position={catPos}
        state={catState}
        facing={facing}
        isWalking={isWalking}
        isBehindCard={isBehindCard}
      />

      <div className="auth-card" ref={cardRef}>
        <div className="auth-header">
          <span className="auth-welcome-pill">GET STARTED</span>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join our cozy community by filling out your details</p>
        </div>

        {errorMsg && (
          <div className="alert-box alert-error">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-box alert-success">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              ref={nameRef}
              id="name"
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => handleInputFocus('name', nameRef)}
              onBlur={handleBlur}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              name="email"
              className="form-input"
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => handleInputFocus('email', emailRef)}
              onBlur={handleBlur}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password (Min 8 Chars)</label>
            <input
              ref={passwordRef}
              id="password"
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => handleInputFocus('password', passwordRef)}
              onBlur={handleBlur}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account 🐾'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};
