import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Music2,
  AlertCircle,
  X,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration, getArtworkBackground } from '../utils/artwork';

export default function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isLoading,
    playerError,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    isLiked,
    clearError,
  } = usePlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);

  // Fallback background
  const bgGradient = currentSong
    ? getArtworkBackground(currentSong._id || currentSong.title)
    : 'linear-gradient(135deg, #282828 0%, #121212 100%)';

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayProgress = isSeeking ? (seekVal / (duration || 1)) * 100 : progressPercent;

  const handleSeekChange = (e) => {
    setIsSeeking(true);
    setSeekVal(parseFloat(e.target.value));
  };

  const handleSeekCommit = () => {
    seek(seekVal);
    setIsSeeking(false);
  };

  const artistName =
    typeof currentSong?.artist === 'object' && currentSong?.artist?.username
      ? currentSong.artist.username
      : 'Unknown Artist';

  return (
    <>
      {/* Playback Error Toast Banner */}
      {playerError && (
        <div className="player-error-banner">
          <AlertCircle size={18} className="banner-icon" />
          <span className="banner-text">{playerError}</span>
          <button type="button" className="banner-close" onClick={clearError}>
            <X size={16} />
          </button>
        </div>
      )}

      <footer className="spotify-bottom-player">
        {/* Left: Current Song Info */}
        <div className="player-left-song">
          {currentSong ? (
            <>
              <div
                className="player-song-artwork"
                style={{ background: bgGradient }}
              >
                <Music2 size={24} color="#ffffff" />
              </div>
              <div className="player-song-details">
                <span className="player-song-title" title={currentSong.title}>
                  {currentSong.title}
                </span>
                <span className="player-song-artist" title={artistName}>
                  {artistName}
                </span>
              </div>
              <button
                type="button"
                className={`player-like-btn ${isLiked(currentSong._id) ? 'liked' : ''}`}
                onClick={() => toggleLike(currentSong._id)}
                title={isLiked(currentSong._id) ? 'Remove from Liked' : 'Save to Liked'}
              >
                <Heart
                  size={18}
                  fill={isLiked(currentSong._id) ? '#1db954' : 'none'}
                  color={isLiked(currentSong._id) ? '#1db954' : '#b3b3b3'}
                />
              </button>
            </>
          ) : (
            <div className="player-idle-placeholder">
              <Music2 size={20} color="#727272" />
              <span>No song playing. Select a track to start!</span>
            </div>
          )}
        </div>

        {/* Center: Playback Controls & Scrubber */}
        <div className="player-center-controls">
          <div className="player-buttons-row">
            <button
              type="button"
              className={`player-sub-btn ${isShuffle ? 'active-toggle' : ''}`}
              onClick={toggleShuffle}
              title={isShuffle ? 'Disable Shuffle' : 'Enable Shuffle'}
            >
              <Shuffle size={18} />
            </button>

            <button
              type="button"
              className="player-sub-btn"
              onClick={playPrevious}
              disabled={!currentSong}
              title="Previous song"
            >
              <SkipBack size={20} />
            </button>

            <button
              type="button"
              className="player-main-play-btn"
              onClick={togglePlay}
              disabled={!currentSong && !isLoading}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="spinner-small" />
              ) : isPlaying ? (
                <Pause size={20} fill="#000000" color="#000000" />
              ) : (
                <Play size={20} fill="#000000" color="#000000" style={{ marginLeft: '2px' }} />
              )}
            </button>

            <button
              type="button"
              className="player-sub-btn"
              onClick={playNext}
              disabled={!currentSong}
              title="Next song"
            >
              <SkipForward size={20} />
            </button>

            <button
              type="button"
              className={`player-sub-btn ${repeatMode !== 'off' ? 'active-toggle' : ''}`}
              onClick={toggleRepeat}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          {/* Scrubber / Progress Bar */}
          <div className="player-progress-row">
            <span className="player-time-label">
              {formatDuration(isSeeking ? seekVal : currentTime)}
            </span>

            <div className="player-slider-track-wrap">
              <input
                type="range"
                className="spotify-range-slider"
                min="0"
                max={duration || 100}
                step="0.1"
                value={isSeeking ? seekVal : currentTime}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                style={{
                  background: `linear-gradient(to right, #1db954 ${displayProgress}%, #4d4d4d ${displayProgress}%)`,
                }}
              />
            </div>

            <span className="player-time-label">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Utilities */}
        <div className="player-right-volume">
          <button
            type="button"
            className="player-volume-btn"
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={20} />
            ) : volume < 0.5 ? (
              <Volume1 size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>

          <div className="player-volume-slider-wrap">
            <input
              type="range"
              className="spotify-range-slider volume-slider"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{
                background: `linear-gradient(to right, #1db954 ${(isMuted ? 0 : volume) * 100}%, #4d4d4d ${(isMuted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>
        </div>
      </footer>
    </>
  );
}
