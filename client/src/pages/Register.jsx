import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, UserPlus, Lock, Mail, User, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' | 'artist'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await register({
      username: username.trim(),
      email: email.trim(),
      password,
      role,
    });

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error);
    }
    setLoading(false);
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
        <h2 className="auth-title">Sign up for free to start listening</h2>

        {error && (
          <div className="auth-error-box">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>What's your email?</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Create a username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Create a password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <div className="role-selector-row">
              <button
                type="button"
                className={`role-select-btn ${role === 'user' ? 'selected' : ''}`}
                onClick={() => setRole('user')}
              >
                <User size={18} />
                <span>Listener</span>
              </button>
              <button
                type="button"
                className={`role-select-btn ${role === 'artist' ? 'selected' : ''}`}
                onClick={() => setRole('artist')}
              >
                <Mic size={18} />
                <span>Artist</span>
              </button>
            </div>
            <p className="role-hint">
              {role === 'artist'
                ? 'Artists can upload audio tracks and publish albums to Spotify.'
                : 'Listeners can browse, search, and stream all albums and tracks.'}
            </p>
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? <div className="spinner-small" /> : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider" />

        <div className="auth-footer-prompt">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-footer-link">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
