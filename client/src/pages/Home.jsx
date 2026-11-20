import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, AlertCircle, RefreshCw, Disc3, Music } from 'lucide-react';
import { musicAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import MusicCard from '../components/MusicCard';
import AlbumCard from '../components/AlbumCard';
import { getGreeting, getArtworkBackground } from '../utils/artwork';

export default function Home({ onOpenUpload }) {
  const { isAuthenticated, isArtist } = useAuth();
  const { playSong } = usePlayer();
  const navigate = useNavigate();

  const [musics, setMusics] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [musicRes, albumRes] = await Promise.allSettled([
        musicAPI.getAllMusics({ limit: 50 }),
        musicAPI.getAllAlbums(),
      ]);

      if (musicRes.status === 'fulfilled') {
        setMusics(musicRes.value.data?.musics || []);
      } else {
        console.warn('Music fetch error:', musicRes.reason);
        if (musicRes.reason?.response?.status === 401) {
          setError('Please log in to browse and play full music tracks.');
        } else {
          setError('Could not connect to backend music service.');
        }
      }

      if (albumRes.status === 'fulfilled') {
        setAlbums(albumRes.value.data?.albums || []);
      }
    } catch (err) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const greeting = getGreeting();

  // Highlight first few items for the quick-access top grid
  const quickItems = musics.slice(0, 6);
  const featuredSongs = musics.slice(0, 5);
  const recentSongs = [...musics].reverse().slice(0, 5);

  return (
    <div className="spotify-page-container">
      {/* Hero Greeting */}
      <div className="home-hero-header">
        <h1 className="home-greeting-text">{greeting}</h1>
        {isArtist && (
          <button
            type="button"
            className="btn-spotify-pill artist-badge-btn"
            onClick={onOpenUpload}
          >
            + Upload New Music
          </button>
        )}
      </div>

      {/* Guest / Auth reminder banner if not logged in */}
      {!isAuthenticated && (
        <div className="auth-alert-banner">
          <div className="alert-content">
            <Sparkles size={22} className="alert-sparkle" />
            <div>
              <strong>Welcome to Spotify Web Player!</strong>
              <p>Log in or sign up to stream and enjoy all tracks from the library.</p>
            </div>
          </div>
          <div className="banner-buttons">
            <button
              type="button"
              className="btn-spotify-small btn-primary"
              onClick={() => navigate('/login')}
            >
              Log in
            </button>
            <button
              type="button"
              className="btn-spotify-small btn-outline"
              onClick={() => navigate('/register')}
            >
              Sign up
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spotify-loading-container">
          <div className="spotify-spinner" />
          <p>Loading your music library...</p>
        </div>
      ) : error ? (
        <div className="spotify-empty-state error-state">
          <AlertCircle size={40} color="#e91e63" />
          <h3>{error}</h3>
          {!isAuthenticated ? (
            <button
              type="button"
              className="btn-spotify-primary"
              onClick={() => navigate('/login')}
            >
              Log in to listen
            </button>
          ) : (
            <button
              type="button"
              className="btn-spotify-secondary"
              onClick={fetchData}
            >
              <RefreshCw size={16} /> Retry
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Quick Access Grid (Spotify desktop 6-item top grid) */}
          {quickItems.length > 0 && (
            <div className="quick-grid">
              {quickItems.map((song) => {
                const bg = getArtworkBackground(song._id || song.title);
                return (
                  <div
                    key={song._id}
                    className="quick-grid-item"
                    onClick={() => playSong(song, musics)}
                  >
                    <div className="quick-art" style={{ background: bg }}>
                      <Music size={24} color="#fff" />
                    </div>
                    <span className="quick-title" title={song.title}>
                      {song.title}
                    </span>
                    <button
                      type="button"
                      className="quick-play-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSong(song, musics);
                      }}
                      title="Play"
                    >
                      <Play size={20} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 1: Featured Music */}
          <section className="spotify-section">
            <div className="section-header-row">
              <h2 className="section-title">Featured Music</h2>
              <span className="section-link" onClick={() => navigate('/library')}>
                Show all
              </span>
            </div>
            {featuredSongs.length === 0 ? (
              <p className="empty-subtext">No music uploaded yet.</p>
            ) : (
              <div className="cards-grid">
                {featuredSongs.map((song) => (
                  <MusicCard key={song._id} song={song} queue={musics} />
                ))}
              </div>
            )}
          </section>

          {/* Section 2: Popular Albums */}
          {albums.length > 0 && (
            <section className="spotify-section">
              <div className="section-header-row">
                <h2 className="section-title">Albums</h2>
                <span className="section-link" onClick={() => navigate('/library?tab=albums')}>
                  Show all
                </span>
              </div>
              <div className="cards-grid">
                {albums.map((album) => (
                  <AlbumCard key={album._id} album={album} />
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Recently Added Tracks */}
          <section className="spotify-section">
            <div className="section-header-row">
              <h2 className="section-title">Recently Added</h2>
            </div>
            {recentSongs.length === 0 ? (
              <p className="empty-subtext">No recently added tracks.</p>
            ) : (
              <div className="cards-grid">
                {recentSongs.map((song) => (
                  <MusicCard key={song._id} song={song} queue={musics} />
                ))}
              </div>
            )}
          </section>

          {/* Section 4: All Available Songs */}
          <section className="spotify-section">
            <div className="section-header-row">
              <h2 className="section-title">All Available Songs ({musics.length})</h2>
            </div>
            {musics.length === 0 ? (
              <div className="spotify-empty-state">
                <Music size={40} color="#727272" />
                <p>No songs found in the backend.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {musics.map((song) => (
                  <MusicCard key={song._id} song={song} queue={musics} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
