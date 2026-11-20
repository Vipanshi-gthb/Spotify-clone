import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Upload,
  PlusCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenUpload }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, isArtist } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="spotify-topbar">
      {/* History navigation buttons */}
      <div className="nav-history-buttons">
        <button
          type="button"
          className="history-circle-btn"
          onClick={() => navigate(-1)}
          title="Go back"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="history-circle-btn"
          onClick={() => navigate(1)}
          title="Go forward"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Center title or search pill info */}
      <div className="topbar-center-info">
        {location.pathname.startsWith('/album/') && (
          <span className="page-header-crumb">Album Details</span>
        )}
        {location.pathname === '/search' && (
          <span className="page-header-crumb">Search Catalog</span>
        )}
        {location.pathname === '/library' && (
          <span className="page-header-crumb">Your Music Library</span>
        )}
      </div>

      {/* Right controls */}
      <div className="topbar-right-controls">
        {isArtist && (
          <button
            type="button"
            className="topbar-upload-btn"
            onClick={onOpenUpload}
          >
            <Upload size={16} />
            <span>Upload Song</span>
          </button>
        )}

        {isAuthenticated ? (
          <div className="profile-menu-container">
            <button
              type="button"
              className="profile-pill-btn"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <div className="profile-pill-avatar">
                <User size={16} />
              </div>
              <span className="profile-pill-name">{user?.username}</span>
              {user?.role === 'artist' && <span className="pill-artist-tag">Artist</span>}
            </button>

            {dropdownOpen && (
              <div
                className="profile-dropdown-menu"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="dropdown-user-header">
                  <strong>{user?.username}</strong>
                  <span className="dropdown-email">{user?.email}</span>
                </div>
                <div className="dropdown-divider" />
                {isArtist && (
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenUpload();
                    }}
                  >
                    <PlusCircle size={16} />
                    <span>Upload Track / Album</span>
                  </button>
                )}
                <button
                  type="button"
                  className="dropdown-item logout"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="topbar-auth-links">
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => navigate('/register')}
            >
              Sign up
            </button>
            <button
              type="button"
              className="btn-spotify-pill"
              onClick={() => navigate('/login')}
            >
              Log in
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
