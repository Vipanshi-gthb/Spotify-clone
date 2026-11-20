import React from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getArtworkBackground } from '../utils/artwork';

export default function MusicCard({ song, queue = [] }) {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const isThisPlaying = currentSong?._id === song._id && isPlaying;
  const isThisCurrent = currentSong?._id === song._id;

  const handleCardClick = () => {
    if (isThisCurrent) {
      togglePlay();
    } else {
      playSong(song, queue.length > 0 ? queue : [song]);
    }
  };

  const bgGradient = getArtworkBackground(song._id || song.title);
  const artistName =
    typeof song.artist === 'object' && song.artist?.username
      ? song.artist.username
      : 'Artist';

  return (
    <div
      className={`spotify-music-card ${isThisCurrent ? 'is-active' : ''}`}
      onClick={handleCardClick}
    >
      <div className="card-artwork-wrapper" style={{ background: bgGradient }}>
        <Music size={48} className="card-placeholder-icon" />

        {/* Hover / Active Play Button */}
        <button
          type="button"
          className={`card-play-hover-btn ${isThisPlaying ? 'visible playing' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          title={isThisPlaying ? 'Pause' : 'Play'}
        >
          {isThisPlaying ? (
            <Pause size={22} fill="#000000" color="#000000" />
          ) : (
            <Play size={22} fill="#000000" color="#000000" style={{ marginLeft: '2px' }} />
          )}
        </button>
      </div>

      <div className="card-meta">
        <h4 className="card-title" title={song.title}>
          {song.title}
        </h4>
        <p className="card-subtitle" title={artistName}>
          {artistName}
        </p>
      </div>
    </div>
  );
}
