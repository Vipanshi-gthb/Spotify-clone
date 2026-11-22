import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  PlusCircle,
  LogIn,
  Users,
  Music,
  ArrowRight,
  Sparkles,
  Volume2,
  Headphones,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';

export default function ListeningRooms() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [createRoomName, setCreateRoomName] = useState('');
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [publicRooms, setPublicRooms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    const fetchPublicRooms = () => {
      socket.emit('get-public-rooms');
    };

    if (socket.connected) {
      fetchPublicRooms();
    }
    socket.on('connect', fetchPublicRooms);

    const handleRoomsList = (rooms) => {
      setPublicRooms(rooms || []);
    };

    const handleRoomCreated = ({ roomCode }) => {
      navigate(`/room/${roomCode}`);
    };

    const handleError = ({ message }) => {
      setError(message);
    };

    const handleConnectError = (err) => {
      console.warn('Socket connect error:', err.message);
    };

    socket.on('public-rooms-list', handleRoomsList);
    socket.on('room-created', handleRoomCreated);
    socket.on('error-message', handleError);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', fetchPublicRooms);
      socket.off('public-rooms-list', handleRoomsList);
      socket.off('room-created', handleRoomCreated);
      socket.off('error-message', handleError);
      socket.off('connect_error', handleConnectError);
    };
  }, [navigate, isAuthenticated]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    let cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a room code');
      return;
    }
    if (!cleanCode.startsWith('ROOM-') && cleanCode.length === 4) {
      cleanCode = 'ROOM-' + cleanCode;
    }
    navigate(`/room/${cleanCode}`);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const socket = getSocket();
    socket.emit('create-room', {
      roomName: createRoomName.trim() || `${user?.username}'s Room`,
    });
  };

  return (
    <div className="spotify-page-container rooms-page">
      {/* Hero Header */}
      <div className="rooms-hero-header">
        <div className="hero-badge live-pulse">
          <span className="pulse-dot" />
          <span>REAL-TIME SYNCHRONIZED LISTENING</span>
        </div>
        <h1 className="section-title" style={{ fontSize: '2.4rem' }}>
          Virtual Listening Rooms
        </h1>
        <p className="rooms-hero-sub">
          Tune in together with friends from anywhere. Synchronized playback, shared queue, live chat, and instant reactions.
        </p>

        {/* Action Row: Create + Join */}
        <div className="rooms-action-cards-grid">
          {/* Card 1: Create Room */}
          <div className="room-action-card create-card">
            <div className="action-card-icon">
              <Headphones size={28} color="#1db954" />
            </div>
            <h3>Host a Listening Room</h3>
            <p>Start a session, control the queue, and invite friends with your unique code.</p>
            <button
              type="button"
              className="btn-spotify-primary"
              onClick={() => {
                if (!isAuthenticated) navigate('/login');
                else setIsCreatingModal(true);
              }}
            >
              <PlusCircle size={18} />
              <span>Create Room</span>
            </button>
          </div>

          {/* Card 2: Join with Code */}
          <div className="room-action-card join-card">
            <div className="action-card-icon">
              <Users size={28} color="#5798ff" />
            </div>
            <h3>Join Existing Room</h3>
            <p>Have an invitation code? Enter it below to join the shared session immediately.</p>
            <form onSubmit={handleJoin} className="join-code-form">
              <input
                type="text"
                placeholder="e.g. ROOM-7824"
                value={roomCodeInput}
                onChange={(e) => {
                  setRoomCodeInput(e.target.value.toUpperCase());
                  setError(null);
                }}
              />
              <button type="submit" className="btn-spotify-secondary">
                Join <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="modal-status-box error" style={{ maxWidth: '640px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Active Public Rooms Section */}
      <section className="spotify-section">
        <div className="section-header-row">
          <h2 className="section-title">Live Public Sessions ({publicRooms.length})</h2>
          <span className="section-link" onClick={() => getSocket().emit('get-public-rooms')}>
            Refresh list
          </span>
        </div>

        {publicRooms.length === 0 ? (
          <div className="spotify-empty-state rooms-empty-state">
            <Radio size={44} color="#727272" />
            <h3>No Live Rooms Active Right Now</h3>
            <p>Create a room above to start listening with your friends!</p>
          </div>
        ) : (
          <div className="cards-grid live-rooms-grid">
            {publicRooms.map((room) => (
              <div
                key={room.roomCode}
                className="live-room-card"
                onClick={() => {
                  if (!isAuthenticated) navigate('/login');
                  else navigate(`/room/${room.roomCode}`);
                }}
              >
                <div className="room-card-top">
                  <div className="room-code-tag">{room.roomCode}</div>
                  <div className="room-listeners-badge">
                    <Users size={14} />
                    <span>{room.participantCount} online</span>
                  </div>
                </div>

                <h4 className="room-card-name">{room.name}</h4>
                <p className="room-card-host">Host: {room.hostName}</p>

                <div className="room-card-track">
                  <Volume2 size={16} className="track-playing-icon" />
                  <span className="track-title-ticker">
                    {room.currentSong
                      ? `${room.currentSong.title} — ${room.currentSong.artist}`
                      : 'Waiting for host to pick a track...'}
                  </span>
                </div>

                <button type="button" className="room-join-btn">
                  Join Room
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Room Modal */}
      {isCreatingModal && (
        <div className="spotify-modal-backdrop" onClick={() => setIsCreatingModal(false)}>
          <div className="spotify-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Listening Room</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreatingModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="modal-form">
              <div className="form-group">
                <label>Room Name (Optional)</label>
                <input
                  type="text"
                  placeholder={`e.g. ${user?.username}'s Chill Lounge`}
                  value={createRoomName}
                  onChange={(e) => setCreateRoomName(e.target.value)}
                  maxLength={40}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-spotify-secondary"
                  onClick={() => setIsCreatingModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-spotify-primary">
                  Launch Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
