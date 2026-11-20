import React, { useState, useEffect } from 'react';
import { X, Camera, Music, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { musicAPI } from '../../services/api';
import { storyAPI } from '../../services/storyApi';
import { getArtworkBackground } from '../../utils/artwork';

export default function CreateStoryModal({ isOpen, onClose, onStoryCreated }) {
  const [musics, setMusics] = useState([]);
  const [songSearch, setSongSearch] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadMusicCatalog();
    }
  }, [isOpen]);

  const loadMusicCatalog = async () => {
    try {
      const res = await musicAPI.getAllMusics({ limit: 100 });
      setMusics(res.data?.musics || []);
    } catch (err) {
      console.warn('Failed to fetch songs for story modal:', err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (.jpg, .png, .webp)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size exceeds 10MB limit.');
      return;
    }

    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const filteredSongs = musics.filter((s) => {
    const titleMatch = s.title?.toLowerCase().includes(songSearch.toLowerCase());
    const artistMatch = s.artist?.username?.toLowerCase().includes(songSearch.toLowerCase());
    return titleMatch || artistMatch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSong) {
      setError('Please select a song that matches your story.');
      return;
    }
    if (!imageFile) {
      setError('Please upload a photograph for your story.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('songId', selectedSong._id);
      formData.append('image', imageFile);
      formData.append('note', note.trim());

      const res = await storyAPI.createStory(formData);

      if (onStoryCreated) {
        onStoryCreated(res.data?.story);
      }

      // Reset state and close
      setSelectedSong(null);
      setImageFile(null);
      setImagePreview(null);
      setNote('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Failed to publish story');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="spotify-modal-backdrop" onClick={onClose}>
      <div className="spotify-modal-content story-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <Camera size={22} color="#1db954" />
            <h3>Share a Song Story</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="modal-status-box error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form story-form">
          {/* 1. Select Song */}
          <div className="form-group">
            <label>1. Select Associated Song</label>
            {selectedSong ? (
              <div className="selected-song-card">
                <div
                  className="song-chip-art"
                  style={{ background: getArtworkBackground(selectedSong._id || selectedSong.title) }}
                >
                  <Music size={18} color="#fff" />
                </div>
                <div className="song-chip-details">
                  <span className="chip-title">{selectedSong.title}</span>
                  <span className="chip-artist">{selectedSong.artist?.username || 'Artist'}</span>
                </div>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => setSelectedSong(null)}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="song-picker-wrap">
                <div className="input-with-icon" style={{ marginBottom: '8px' }}>
                  <Search size={16} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Search songs or artists..."
                    value={songSearch}
                    onChange={(e) => setSongSearch(e.target.value)}
                  />
                </div>
                <div className="song-picker-dropdown">
                  {filteredSongs.length === 0 ? (
                    <p className="empty-hint">No matching songs found</p>
                  ) : (
                    filteredSongs.map((song) => (
                      <div
                        key={song._id}
                        className="song-picker-item"
                        onClick={() => setSelectedSong(song)}
                      >
                        <div
                          className="picker-item-art"
                          style={{ background: getArtworkBackground(song._id || song.title) }}
                        >
                          <Music size={14} color="#fff" />
                        </div>
                        <div className="picker-item-info">
                          <span className="picker-item-title">{song.title}</span>
                          <span className="picker-item-artist">{song.artist?.username || 'Artist'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Upload Photograph */}
          <div className="form-group">
            <label>2. Upload Photograph / Memory</label>
            <div className="story-photo-dropzone">
              {imagePreview ? (
                <div className="photo-preview-box">
                  <img src={imagePreview} alt="Story preview" className="story-preview-img" />
                  <button
                    type="button"
                    className="change-photo-btn"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <label className="photo-upload-placeholder">
                  <Camera size={36} color="#727272" />
                  <span>Click to choose a photo</span>
                  <span className="upload-subtext">JPG, PNG, WEBP (Max 10MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 3. Personal Note */}
          <div className="form-group">
            <div className="label-with-counter">
              <label>3. What memory or emotion does this track bring back?</label>
              <span className={`char-counter ${note.length > 280 ? 'limit-warning' : ''}`}>
                {note.length} / 300
              </span>
            </div>
            <textarea
              className="story-textarea"
              placeholder="Write a personal note, memory, or feeling (up to 300 characters)..."
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-spotify-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-spotify-primary"
              disabled={loading || !selectedSong || !imageFile}
            >
              {loading ? 'Publishing...' : 'Publish Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
