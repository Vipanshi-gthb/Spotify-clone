import React, { useState, useEffect } from 'react';
import { X, Upload, Disc3, Music, CheckCircle2, AlertCircle } from 'lucide-react';
import { musicAPI } from '../services/api';

export default function UploadModal({ isOpen, onClose, onSongUploaded }) {
  const [activeTab, setActiveTab] = useState('song'); // 'song' | 'album'
  const [songTitle, setSongTitle] = useState('');
  const [audioFile, setAudioFile] = useState(null);

  // Album creation state
  const [albumTitle, setAlbumTitle] = useState('');
  const [availableSongs, setAvailableSongs] = useState([]);
  const [selectedSongIds, setSelectedSongIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isOpen && activeTab === 'album') {
      fetchExistingSongs();
    }
  }, [isOpen, activeTab]);

  const fetchExistingSongs = async () => {
    try {
      const res = await musicAPI.getAllMusics();
      setAvailableSongs(res.data?.musics || []);
    } catch (err) {
      console.error('Failed to fetch songs for album modal:', err);
    }
  };

  if (!isOpen) return null;

  const handleUploadSong = async (e) => {
    e.preventDefault();
    if (!songTitle.trim() || !audioFile) {
      setStatusMessage({ type: 'error', text: 'Please provide a title and audio file (.mp3, etc.)' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('title', songTitle.trim());
      formData.append('music', audioFile);

      await musicAPI.uploadMusic(formData);
      setStatusMessage({ type: 'success', text: `Song "${songTitle}" uploaded successfully!` });
      setSongTitle('');
      setAudioFile(null);
      if (onSongUploaded) onSongUploaded();
      setTimeout(() => {
        onClose();
        setStatusMessage({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.msg || err.message || 'Failed to upload song',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!albumTitle.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide an album title' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      await musicAPI.createAlbum({
        title: albumTitle.trim(),
        musics: selectedSongIds,
      });

      setStatusMessage({ type: 'success', text: `Album "${albumTitle}" created successfully!` });
      setAlbumTitle('');
      setSelectedSongIds([]);
      if (onSongUploaded) onSongUploaded();
      setTimeout(() => {
        onClose();
        setStatusMessage({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.msg || err.message || 'Failed to create album',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectSong = (id) => {
    setSelectedSongIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  return (
    <div className="spotify-modal-backdrop" onClick={onClose}>
      <div className="spotify-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Artist Studio</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="modal-tab-row">
          <button
            type="button"
            className={`modal-tab ${activeTab === 'song' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('song');
              setStatusMessage({ type: '', text: '' });
            }}
          >
            <Music size={18} />
            <span>Upload Track</span>
          </button>
          <button
            type="button"
            className={`modal-tab ${activeTab === 'album' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('album');
              setStatusMessage({ type: '', text: '' });
            }}
          >
            <Disc3 size={18} />
            <span>Create Album</span>
          </button>
        </div>

        {statusMessage.text && (
          <div className={`modal-status-box ${statusMessage.type}`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {activeTab === 'song' ? (
          <form onSubmit={handleUploadSong} className="modal-form">
            <div className="form-group">
              <label>Track Title</label>
              <input
                type="text"
                placeholder="e.g. Midnight City"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Audio File (.mp3, .wav, etc.)</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files[0])}
                  required
                />
              </div>
              {audioFile && <span className="selected-filename">{audioFile.name}</span>}
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
                disabled={loading || !songTitle || !audioFile}
              >
                {loading ? 'Uploading...' : 'Upload Song'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateAlbum} className="modal-form">
            <div className="form-group">
              <label>Album Title</label>
              <input
                type="text"
                placeholder="e.g. Greatest Hits Vol. 1"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Select Tracks to Include ({selectedSongIds.length} selected)</label>
              <div className="modal-song-checkbox-list">
                {availableSongs.length === 0 ? (
                  <p className="empty-hint">No tracks found. Upload tracks first!</p>
                ) : (
                  availableSongs.map((s) => (
                    <label key={s._id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedSongIds.includes(s._id)}
                        onChange={() => toggleSelectSong(s._id)}
                      />
                      <span>{s.title}</span>
                    </label>
                  ))
                )}
              </div>
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
                disabled={loading || !albumTitle}
              >
                {loading ? 'Creating...' : 'Create Album'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
