import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  Library,
  Heart,
  Upload,
  Disc3,
  LogOut,
  User,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onOpenUpload }) {
  const { user, isAuthenticated, logout, isArtist } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="spotify-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand" onClick={() => navigate('/')}>
        <div className="spotify-logo-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="34" height="34">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>
        <span className="brand-text">Spotify</span>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={22} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Search size={22} />
          <span>Search</span>
        </NavLink>

        <NavLink
          to="/library"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Library size={22} />
          <span>Your Library</span>
        </NavLink>
      </nav>

      {/* Social Music Features Section */}
      <div className="sidebar-divider" />
      <div className="sidebar-section">
        <div className="sidebar-section-title">Social Community</div>

        <NavLink
          to="/rooms"
          className={({ isActive }) => `nav-item social-nav ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-box rooms-icon-box">
            <Radio size={16} />
          </div>
          <span>Listening Rooms</span>
        </NavLink>

        <NavLink
          to="/stories"
          className={({ isActive }) => `nav-item social-nav ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-box stories-icon-box">
            <Sparkles size={16} />
          </div>
          <span>Song Stories</span>
        </NavLink>
      </div>

      {/* Secondary Actions / Playlists */}
      <div className="sidebar-divider" />
      <div className="sidebar-section">
        <div className="sidebar-section-title">Playlists & Favorites</div>
        <NavLink
          to="/library?tab=liked"
          className={({ isActive }) => `nav-item secondary-nav ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-box liked-icon-box">
            <Heart size={16} fill="white" color="white" />
          </div>
          <span>Liked Songs</span>
        </NavLink>

        <NavLink
          to="/library?tab=albums"
          className={({ isActive }) => `nav-item secondary-nav ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-box album-icon-box">
            <Disc3 size={16} />
          </div>
          <span>Your Albums</span>
        </NavLink>
      </div>

      {/* Artist Section (Visible for Artists) */}
      {isArtist && (
        <div className="sidebar-section artist-section">
          <div className="sidebar-section-title">Artist Studio</div>
          <button
            type="button"
            className="artist-action-btn"
            onClick={onOpenUpload}
          >
            <Upload size={18} />
            <span>Upload Music</span>
          </button>
        </div>
      )}

      {/* Spacer to push user info to bottom */}
      <div className="sidebar-spacer" />

      {/* User / Session Area */}
      <div className="sidebar-user-section">
        {isAuthenticated ? (
          <div className="user-profile-badge">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div className="user-info-text">
              <span className="user-name">{user?.username}</span>
              <span className="user-role-badge">
                {user?.role === 'artist' ? 'Artist Account' : 'Listener'}
              </span>
            </div>
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={logout}
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="guest-prompt-box">
            <p className="guest-prompt-title">Preview Spotify</p>
            <p className="guest-prompt-sub">Sign up to listen and join live rooms.</p>
            <div className="guest-buttons">
              <button
                type="button"
                className="btn-spotify-small btn-primary"
                onClick={() => navigate('/login')}
              >
                Log In
              </button>
              <button
                type="button"
                className="btn-spotify-small btn-outline"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
