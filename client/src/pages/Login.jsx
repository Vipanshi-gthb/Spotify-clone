import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, LogIn, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError('Please enter your email or username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    // Backend login accepts either { email, password } or { username, password }
    const credentials = usernameOrEmail.includes('@')
      ? { email: usernameOrEmail.trim(), password }
      : { username: usernameOrEmail.trim(), password };

    const result = await login(credentials);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleQuickFill = (type) => {
    if (type === 'artist') {
      setUsernameOrEmail('test_2@test.com');
      setPassword('password123');
    } else {
      setUsernameOrEmail('test@test.com');
      setPassword('password123');
    }
  };

  return (
    <div className="spotify-auth-page">
      <div className="auth-brand-header" onClick={() => navigate('/')}>
        <div className="spotify-logo-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>
        <span className="brand-text">Spotify</span>
      </div>

      <div className="auth-card">
        <h2 className="auth-title">Log in to Spotify</h2>

        {error && (
          <div className="auth-error-box">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email or username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Email or username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? <div className="spinner-small" /> : 'Log In'}
          </button>
        </form>

        {/* Quick Fill Helper for Evaluation */}
        <div className="quick-fill-section">
          <span className="quick-fill-label">Quick Test Accounts:</span>
          <div className="quick-fill-buttons">
            <button
              type="button"
              className="btn-quick-fill"
              onClick={() => handleQuickFill('user')}
            >
              Fill Listener (test@test.com)
            </button>
            <button
              type="button"
              className="btn-quick-fill"
              onClick={() => handleQuickFill('artist')}
            >
              Fill Artist (test_2@test.com)
            </button>
          </div>
        </div>

        <div className="auth-divider" />

        <div className="auth-footer-prompt">
          <span>Don't have an account?</span>
          <Link to="/register" className="auth-footer-link">
            Sign up for Spotify
          </Link>
        </div>
      </div>
    </div>
  );
}
