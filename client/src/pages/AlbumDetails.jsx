import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Disc3, Clock, AlertCircle, ArrowLeft, Music } from 'lucide-react';
import { musicAPI } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { getArtworkBackground, formatDuration } from '../utils/artwork';

export default function AlbumDetails() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAlbum() {
      setLoading(true);
      setError(null);
      try {
        const res = await musicAPI.getAlbumById(albumId);
        setAlbum(res.data?.album);
      } catch (err) {
        setError(err.response?.data?.msg || err.message || 'Failed to load album');
      } finally {
        setLoading(false);
      }
    }
    if (albumId) {
      fetchAlbum();
    }
  }, [albumId]);

  if (loading) {
    return (
      <div className="spotify-page-container">
        <div className="spotify-loading-container">
          <div className="spotify-spinner" />
          <p>Loading album details...</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="spotify-page-container">
        <div className="spotify-empty-state error-state">
          <AlertCircle size={44} color="#e91e63" />
          <h3>{error || 'Album not found'}</h3>
          <button
            type="button"
            className="btn-spotify-secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const bgGradient = getArtworkBackground(album._id || album.title);
  const artistName = album.artist?.username || 'Artist';
  const songList = Array.isArray(album.musics) ? album.musics : [];

  const isAlbumPlaying =
    isPlaying && songList.some((s) => s._id === currentSong?._id);

  const handlePlayAll = () => {
    if (songList.length === 0) return;
    if (isAlbumPlaying) {
      togglePlay();
    } else {
      playSong(songList[0], songList);
    }
  };

  return (
    <div className="spotify-page-container album-page">
      {/* Large Spotify Album Header */}
      <div className="album-hero-banner" style={{ background: `linear-gradient(180deg, rgba(30,50,70,0.8) 0%, rgba(18,18,18,1) 100%)` }}>
        <div className="album-hero-cover" style={{ background: bgGradient }}>
          <Disc3 size={90} color="#ffffff" />
        </div>

        <div className="album-hero-info">
          <span className="album-badge-label">ALBUM</span>
          <h1 className="album-hero-title">{album.title}</h1>
          <div className="album-hero-meta">
            <span className="artist-bold">{artistName}</span>
            <span className="meta-dot">•</span>
            <span>{songList.length} {songList.length === 1 ? 'song' : 'songs'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="album-action-bar">
        <button
          type="button"
          className="album-big-play-btn"
          onClick={handlePlayAll}
          disabled={songList.length === 0}
          title={isAlbumPlaying ? 'Pause' : 'Play Album'}
        >
          {isAlbumPlaying ? (
            <Pause size={28} fill="#000000" color="#000000" />
          ) : (
            <Play size={28} fill="#000000" color="#000000" style={{ marginLeft: '3px' }} />
          )}
        </button>
      </div>

      {/* Tracks Table */}
      <div className="album-tracks-section">
        {songList.length === 0 ? (
          <div className="spotify-empty-state">
            <Music size={36} color="#727272" />
            <p>No tracks added to this album yet.</p>
          </div>
        ) : (
          <div className="album-track-table">
            <div className="table-header-row">
              <span className="col-idx">#</span>
              <span className="col-title">Title</span>
              <span className="col-artist">Artist</span>
              <span className="col-time">
                <Clock size={16} />
              </span>
            </div>

            <div className="table-rows">
              {songList.map((track, idx) => {
                const isTrackActive = currentSong?._id === track._id;
                const isTrackPlaying = isTrackActive && isPlaying;

                return (
                  <div
                    key={track._id}
                    className={`track-table-row ${isTrackActive ? 'active-track' : ''}`}
                    onClick={() => playSong(track, songList)}
                  >
                    <div className="col-idx">
                      <span className="track-number">{idx + 1}</span>
                      <button
                        type="button"
                        className="track-row-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isTrackActive) togglePlay();
                          else playSong(track, songList);
                        }}
                      >
                        {isTrackPlaying ? (
                          <Pause size={14} fill="#1db954" color="#1db954" />
                        ) : (
                          <Play size={14} fill="#ffffff" color="#ffffff" />
                        )}
                      </button>
                    </div>

                    <div className="col-title">
                      <span className={`track-title-text ${isTrackActive ? 'highlight' : ''}`}>
                        {track.title}
                      </span>
                    </div>

                    <div className="col-artist">
                      <span className="track-artist-text">
                        {track.artist?.username || artistName}
                      </span>
                    </div>

                    <div className="col-time">
                      <span className="track-time-text">Audio</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
