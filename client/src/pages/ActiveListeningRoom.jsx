import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Copy,
  Check,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Send,
  Radio,
  Plus,
  Trash2,
  Crown,
  Volume2,
  VolumeX,
  AlertCircle,
  Music,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import { musicAPI } from '../services/api';
import { getArtworkBackground, formatDuration } from '../utils/artwork';

const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👏', '🎵', '🥹'];

export default function ActiveListeningRoom() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Synchronized Room State
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  // Floating Reactions
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Queue & Add Song Drawer
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [availableSongs, setAvailableSongs] = useState([]);
  const [songFilter, setSongFilter] = useState('');

  // Local synchronized HTML5 Audio element for the room
  const roomAudioRef = useRef(new Audio());
  const [localVolume, setLocalVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentDisplayTime, setCurrentDisplayTime] = useState(0);

  const isHost = room && user && room.hostId === user.id;

  // Initialize Room Socket Connection
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const socket = getSocket();
    const cleanCode = roomCode ? roomCode.toUpperCase() : '';

    socket.emit('join-room', { roomCode: cleanCode });

    const handleRoomState = (state) => {
      setRoom(state);
      setMessages(state.messages || []);
      syncAudioWithPlayback(state.playback);
    };

    const handlePlaybackUpdate = (playback) => {
      setRoom((prev) => (prev ? { ...prev, playback } : prev));
      syncAudioWithPlayback(playback);
    };

    const handleQueueUpdated = ({ queue, queueIndex }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playback: {
            ...prev.playback,
            queue,
            queueIndex: typeof queueIndex === 'number' ? queueIndex : prev.playback.queueIndex,
          },
        };
      });
    };

    const handleRoomMembers = (participants) => {
      setRoom((prev) => (prev ? { ...prev, participants } : prev));
    };

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleReceiveReaction = ({ id, senderName, emoji }) => {
      const reactionId = id || Math.random();
      const randomX = Math.floor(Math.random() * 80) + 10; // 10% to 90%
      setFloatingReactions((prev) => [...prev, { id: reactionId, senderName, emoji, x: randomX }]);

      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
      }, 3000);
    };

    const handleHostTransferred = ({ newHostId, newHostName }) => {
      setRoom((prev) => (prev ? { ...prev, hostId: newHostId, hostName: newHostName } : prev));
    };

    const handleErrorMessage = ({ message }) => {
      setError(message);
    };

    socket.on('room-state', handleRoomState);
    socket.on('playback-update', handlePlaybackUpdate);
    socket.on('queue-updated', handleQueueUpdated);
    socket.on('room-members', handleRoomMembers);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('receive-reaction', handleReceiveReaction);
    socket.on('host-transferred', handleHostTransferred);
    socket.on('error-message', handleErrorMessage);

    // Load available songs for the shared queue
    musicAPI.getAllMusics({ limit: 100 })
      .then((res) => setAvailableSongs(res.data?.musics || []))
      .catch((err) => console.warn('Failed to load songs for queue:', err));

    return () => {
      socket.emit('leave-room');
      socket.off('room-state', handleRoomState);
      socket.off('playback-update', handlePlaybackUpdate);
      socket.off('queue-updated', handleQueueUpdated);
      socket.off('room-members', handleRoomMembers);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('receive-reaction', handleReceiveReaction);
      socket.off('host-transferred', handleHostTransferred);
      socket.off('error-message', handleErrorMessage);

      const audio = roomAudioRef.current;
      audio.pause();
      audio.src = '';
    };
  }, [roomCode, isAuthenticated, navigate]);

  // Audio Sync Engine
  const syncAudioWithPlayback = async (playback) => {
    if (!playback || !playback.currentSong) return;

    const audio = roomAudioRef.current;
    const targetUri = playback.currentSong.uri;
    const expectedPosition = playback.currentPosition || 0;

    if (audio.src !== targetUri) {
      audio.src = targetUri;
      audio.load();
    }

    // Correct drift if more than 1.5 seconds difference
    if (Math.abs(audio.currentTime - expectedPosition) > 1.5) {
      audio.currentTime = expectedPosition;
    }

    if (playback.isPlaying) {
      try {
        await audio.play();
        setAutoplayBlocked(false);
      } catch (err) {
        console.warn('Autoplay blocked:', err.message);
        setAutoplayBlocked(true);
      }
    } else {
      audio.pause();
    }
  };

  // Keep volume updated
  useEffect(() => {
    const audio = roomAudioRef.current;
    audio.volume = isMuted ? 0 : localVolume;

    const updateDisplayTime = () => {
      setCurrentDisplayTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', updateDisplayTime);
    return () => {
      audio.removeEventListener('timeupdate', updateDisplayTime);
    };
  }, [localVolume, isMuted]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Host Controls
  const handleHostTogglePlay = () => {
    if (!isHost || !room) return;
    const socket = getSocket();
    const playback = room.playback;

    if (playback.isPlaying) {
      socket.emit('pause-song', { position: roomAudioRef.current.currentTime });
    } else {
      socket.emit('play-song', {
        song: playback.currentSong,
        position: roomAudioRef.current.currentTime,
      });
    }
  };

  const handleHostSeek = (e) => {
    if (!isHost) return;
    const seekTime = parseFloat(e.target.value);
    const socket = getSocket();
    socket.emit('seek-song', { position: seekTime });
  };

  const handleHostNext = () => {
    if (!isHost) return;
    getSocket().emit('next-song');
  };

  const handleHostPrev = () => {
    if (!isHost) return;
    getSocket().emit('previous-song');
  };

  const handleAddToQueue = (song) => {
    getSocket().emit('add-to-queue', { song });
    setIsAddSongOpen(false);
  };

  const handleRemoveFromQueue = (index) => {
    if (!isHost) return;
    getSocket().emit('remove-from-queue', { index });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    getSocket().emit('send-message', { text: chatInput });
    setChatInput('');
  };

  const handleSendReaction = (emoji) => {
    getSocket().emit('send-reaction', { emoji });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="spotify-page-container">
        <div className="spotify-empty-state error-state">
          <AlertCircle size={44} color="#e91e63" />
          <h3>{error}</h3>
          <button
            type="button"
            className="btn-spotify-secondary"
            onClick={() => navigate('/rooms')}
          >
            <ArrowLeft size={16} /> Return to Rooms
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="spotify-page-container">
        <div className="spotify-loading-container">
          <div className="spotify-spinner" />
          <p>Connecting to virtual room {roomCode}...</p>
        </div>
      </div>
    );
  }

  const currentSong = room.playback?.currentSong;
  const isPlaying = room.playback?.isPlaying;
  const bgGradient = currentSong
    ? getArtworkBackground(currentSong._id || currentSong.title)
    : 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';

  const participantsList = room.participants || [];
  const queueList = room.playback?.queue || [];
  const duration = roomAudioRef.current?.duration || 0;

  return (
    <div className="spotify-page-container active-room-page">
      {/* Floating Animated Reactions Canvas */}
      <div className="floating-reactions-canvas">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="floating-reaction-item"
            style={{ left: `${r.x}%` }}
          >
            <span className="reaction-bubble-emoji">{r.emoji}</span>
            <span className="reaction-bubble-sender">{r.senderName}</span>
          </div>
        ))}
      </div>

      {/* Room Header Topbar */}
      <div className="room-topbar">
        <div className="room-topbar-left">
          <button
            type="button"
            className="room-leave-btn"
            onClick={() => navigate('/rooms')}
            title="Leave Room"
          >
            <ArrowLeft size={18} />
            <span>Leave</span>
          </button>

          <div className="room-title-meta">
            <h2 className="room-heading-title">{room.name}</h2>
            <div className="room-code-badge" onClick={handleCopyCode} title="Click to copy code">
              <span className="code-label">CODE:</span>
              <span className="code-val">{room.roomCode}</span>
              {copied ? <Check size={14} color="#1db954" /> : <Copy size={14} />}
            </div>
          </div>
        </div>

        <div className="room-topbar-right">
          <div className="host-indicator-pill">
            <Crown size={15} color="#f7b733" />
            <span>Host: {room.hostName}</span>
          </div>
          <div className="listeners-count-pill">
            <Users size={15} />
            <span>{participantsList.length} Connected</span>
          </div>
        </div>
      </div>

      {/* Autoplay unlock notice if browser blocks background playback */}
      {autoplayBlocked && (
        <div className="autoplay-alert-box">
          <AlertCircle size={20} color="#ff9800" />
          <span>Browser audio is currently paused waiting for your interaction.</span>
          <button
            type="button"
            className="btn-spotify-small btn-primary"
            onClick={() => syncAudioWithPlayback(room.playback)}
          >
            Click to Start Audio
          </button>
        </div>
      )}

      {/* Main 3-Column / Responsive Layout */}
      <div className="room-main-layout">
        {/* Left Column: Player & Shared Queue */}
        <div className="room-player-column">
          {/* Synchronized Player Card */}
          <div className="room-synced-player-card">
            <div className="room-sync-status-badge">
              <span className={`sync-dot ${isPlaying ? 'live' : ''}`} />
              <span>{isHost ? 'You are controlling playback' : 'In Sync with Host'}</span>
            </div>

            <div className="room-song-hero">
              <div className="room-artwork-large" style={{ background: bgGradient }}>
                <Music size={80} color="#ffffff" />
              </div>

              <div className="room-hero-meta">
                <h3 className="room-hero-title">
                  {currentSong ? currentSong.title : 'No Song Selected'}
                </h3>
                <p className="room-hero-artist">
                  {currentSong?.artist?.username || 'Select a song from the queue'}
                </p>
              </div>
            </div>

            {/* Playback Progress */}
            <div className="room-progress-section">
              <span className="time-text">{formatDuration(currentDisplayTime)}</span>
              <input
                type="range"
                className="spotify-range-slider"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentDisplayTime}
                onChange={handleHostSeek}
                disabled={!isHost}
                title={isHost ? 'Seek audio position' : 'Only host can seek'}
              />
              <span className="time-text">{formatDuration(duration)}</span>
            </div>

            {/* Host Controls */}
            <div className="room-controls-row">
              <button
                type="button"
                className="room-ctrl-btn"
                onClick={handleHostPrev}
                disabled={!isHost || queueList.length === 0}
                title={isHost ? 'Previous' : 'Host only'}
              >
                <SkipBack size={22} />
              </button>

              <button
                type="button"
                className="room-main-play-btn"
                onClick={handleHostTogglePlay}
                disabled={!isHost && !currentSong}
                title={isHost ? (isPlaying ? 'Pause' : 'Play') : 'Host controls playback'}
              >
                {isPlaying ? (
                  <Pause size={24} fill="#000" color="#000" />
                ) : (
                  <Play size={24} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
                )}
              </button>

              <button
                type="button"
                className="room-ctrl-btn"
                onClick={handleHostNext}
                disabled={!isHost || queueList.length === 0}
                title={isHost ? 'Next' : 'Host only'}
              >
                <SkipForward size={22} />
              </button>
            </div>

            {/* Local Volume Slider for Listener */}
            <div className="room-local-volume">
              <button
                type="button"
                className="volume-icon-btn"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted || localVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                className="spotify-range-slider volume-slider"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : localVolume}
                onChange={(e) => setLocalVolume(parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Shared Music Queue Section */}
          <div className="room-queue-panel">
            <div className="queue-header">
              <div className="queue-header-title">
                <h4>Shared Music Queue ({queueList.length})</h4>
                <span className="queue-sub">Everyone can add songs</span>
              </div>
              <button
                type="button"
                className="btn-spotify-small btn-primary add-to-queue-btn"
                onClick={() => setIsAddSongOpen(true)}
              >
                <Plus size={16} />
                <span>Add Song</span>
              </button>
            </div>

            <div className="queue-items-list">
              {queueList.length === 0 ? (
                <div className="queue-empty-hint">
                  <Music size={24} color="#666" />
                  <p>Queue is empty. Tap "+ Add Song" to queue up tracks!</p>
                </div>
              ) : (
                queueList.map((track, idx) => {
                  const isNowPlaying = idx === room.playback?.queueIndex;
                  const trackBg = getArtworkBackground(track._id || track.title);

                  return (
                    <div
                      key={idx}
                      className={`queue-item-row ${isNowPlaying ? 'is-playing' : ''}`}
                    >
                      <span className="queue-idx">{idx + 1}</span>
                      <div className="queue-art" style={{ background: trackBg }}>
                        <Music size={14} color="#fff" />
                      </div>
                      <div className="queue-meta">
                        <span className="queue-title">{track.title}</span>
                        <span className="queue-added-by">
                          Added by {track.addedBy || 'Host'}
                        </span>
                      </div>
                      {isNowPlaying && <span className="now-playing-pill">Playing</span>}

                      {isHost && (
                        <button
                          type="button"
                          className="queue-delete-btn"
                          onClick={() => handleRemoveFromQueue(idx)}
                          title="Remove from queue"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chat, Reactions, Participants */}
        <div className="room-social-column">
          {/* Reaction Bar */}
          <div className="room-reaction-bar">
            <span className="reaction-prompt-label">Live Reaction:</span>
            <div className="reaction-emoji-buttons">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="quick-reaction-btn"
                  onClick={() => handleSendReaction(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Panel */}
          <div className="room-chat-panel">
            <div className="chat-panel-header">
              <h4>Room Chat</h4>
              <span className="chat-count">{messages.length} messages</span>
            </div>

            <div className="chat-messages-container">
              {messages.length === 0 ? (
                <div className="chat-empty-hint">
                  <p>Say hi to everyone in the room! 👋</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = user && m.senderId === user.id;
                  const timeFormatted = m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <div
                      key={m.id}
                      className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}
                    >
                      <div className="chat-bubble-meta">
                        <span className="bubble-author">{m.senderName}</span>
                        <span className="bubble-time">{timeFormatted}</span>
                      </div>
                      <div className="chat-bubble-text">{m.text}</div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                maxLength={500}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={!chatInput.trim()}
                title="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Connected Participants List */}
          <div className="room-participants-panel">
            <div className="participants-header">
              <h4>Listeners ({participantsList.length})</h4>
            </div>
            <div className="participants-list">
              {participantsList.map((p) => (
                <div key={p.userId} className="participant-chip">
                  <div className="participant-avatar">
                    <span className="avatar-initial">{p.username?.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="participant-name">{p.username}</span>
                  {p.isHost && (
                    <span className="host-badge-chip">
                      <Crown size={12} /> Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Song to Queue Modal */}
      {isAddSongOpen && (
        <div className="spotify-modal-backdrop" onClick={() => setIsAddSongOpen(false)}>
          <div className="spotify-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Song to Room Queue</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddSongOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-form">
              <input
                type="text"
                className="spotify-search-input"
                placeholder="Search catalog by title or artist..."
                value={songFilter}
                onChange={(e) => setSongFilter(e.target.value)}
                autoFocus
              />

              <div className="queue-picker-list">
                {availableSongs
                  .filter((s) => {
                    const q = songFilter.toLowerCase();
                    return (
                      s.title?.toLowerCase().includes(q) ||
                      s.artist?.username?.toLowerCase().includes(q)
                    );
                  })
                  .map((song) => (
                    <div
                      key={song._id}
                      className="queue-picker-row"
                      onClick={() => handleAddToQueue(song)}
                    >
                      <div
                        className="picker-art"
                        style={{ background: getArtworkBackground(song._id || song.title) }}
                      >
                        <Music size={16} color="#fff" />
                      </div>
                      <div className="picker-meta">
                        <span className="picker-title">{song.title}</span>
                        <span className="picker-artist">{song.artist?.username || 'Artist'}</span>
                      </div>
                      <button type="button" className="picker-add-btn">
                        Queue Track
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
