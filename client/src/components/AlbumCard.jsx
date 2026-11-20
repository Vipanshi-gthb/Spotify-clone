import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc3, Play } from 'lucide-react';
import { getArtworkBackground } from '../utils/artwork';

export default function AlbumCard({ album }) {
  const navigate = useNavigate();

  const bgGradient = getArtworkBackground(album._id || album.title);
  const artistName =
    typeof album.artist === 'object' && album.artist?.username
      ? album.artist.username
      : 'Various Artists';

  const trackCount = Array.isArray(album.musics) ? album.musics.length : 0;

  return (
    <div
      className="spotify-album-card"
      onClick={() => navigate(`/album/${album._id}`)}
    >
      <div className="card-artwork-wrapper" style={{ background: bgGradient }}>
        <Disc3 size={54} className="card-placeholder-icon" />

        <button
          type="button"
          className="card-play-hover-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/album/${album._id}`);
          }}
          title="Open Album"
        >
          <Play size={22} fill="#000000" color="#000000" style={{ marginLeft: '2px' }} />
        </button>
      </div>

      <div className="card-meta">
        <h4 className="card-title" title={album.title}>
          {album.title}
        </h4>
        <p className="card-subtitle" title={artistName}>
          {artistName} {trackCount > 0 ? `• ${trackCount} songs` : '• Album'}
        </p>
      </div>
    </div>
  );
}
