import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Camera,
  Play,
  Heart,
  Trash2,
  AlertCircle,
  Music,
  User,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { storyAPI } from '../services/storyApi';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import CreateStoryModal from '../components/SongStories/CreateStoryModal';
import { getArtworkBackground } from '../utils/artwork';

const EMOJI_OPTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🥹', label: 'Emotional' },
  { emoji: '😍', label: 'Amazing' },
  { emoji: '👏', label: 'Applause' },
];

export default function SongStories() {
  const { user, isAuthenticated } = useAuth();
  const { playSong } = usePlayer();
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await storyAPI.getAllStories();
      setStories(res.data?.stories || []);
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Failed to fetch song stories');
    } finally {
      setLoading(false);
    }
  };

  const handleStoryCreated = (newStory) => {
    if (newStory) {
      setStories((prev) => [newStory, ...prev]);
    } else {
      fetchStories();
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    try {
      await storyAPI.deleteStory(storyId);
      setStories((prev) => prev.filter((s) => s._id !== storyId));
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to delete story');
    }
  };

  const handleReact = async (storyId, emoji) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Optimistic UI update
    setStories((prev) =>
      prev.map((story) => {
        if (story._id !== storyId) return story;

        const currentReactions = [...(story.reactions || [])];
        const existingIdx = currentReactions.findIndex(
          (r) => r.user === user.id || r.user?._id === user.id
        );

        if (existingIdx !== -1) {
          if (currentReactions[existingIdx].emoji === emoji) {
            // Toggle off
            currentReactions.splice(existingIdx, 1);
          } else {
            // Change
            currentReactions[existingIdx] = { ...currentReactions[existingIdx], emoji };
          }
        } else {
          // Add
          currentReactions.push({ user: user.id, emoji });
        }

        return { ...story, reactions: currentReactions };
      })
    );

    try {
      const res = await storyAPI.reactToStory(storyId, emoji);
      if (res.data?.reactions) {
        setStories((prev) =>
          prev.map((s) => (s._id === storyId ? { ...s, reactions: res.data.reactions } : s))
        );
      }
    } catch (err) {
      console.error('Reaction failed:', err);
      fetchStories(); // Rollback if error
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="spotify-page-container stories-page">
      {/* Header */}
      <div className="stories-hero-header">
        <div className="stories-hero-text">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>COMMUNITY MOMENTS</span>
          </div>
          <h1 className="section-title" style={{ fontSize: '2.4rem' }}>
            Song Stories
          </h1>
          <p className="stories-hero-sub">
            Share personal memories, milestones, and emotions associated with your favorite tracks.
          </p>
        </div>

        <button
          type="button"
          className="btn-spotify-pill stories-create-btn"
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login');
            } else {
              setIsModalOpen(true);
            }
          }}
        >
          <Camera size={18} />
          <span>Share Your Story</span>
        </button>
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="spotify-loading-container">
          <div className="spotify-spinner" />
          <p>Loading community stories...</p>
        </div>
      ) : error ? (
        <div className="spotify-empty-state error-state">
          <AlertCircle size={40} color="#e91e63" />
          <h3>{error}</h3>
          <button type="button" className="btn-spotify-secondary" onClick={fetchStories}>
            Retry
          </button>
        </div>
      ) : stories.length === 0 ? (
        <div className="spotify-empty-state stories-empty">
          <div className="empty-icon-circle">
            <Sparkles size={48} color="#1db954" />
          </div>
          <h3>No Song Stories Yet</h3>
          <p>Be the very first to share a photograph and personal note with your favorite track!</p>
          <button
            type="button"
            className="btn-spotify-primary"
            style={{ marginTop: '12px' }}
            onClick={() => {
              if (!isAuthenticated) navigate('/login');
              else setIsModalOpen(true);
            }}
          >
            Create First Story
          </button>
        </div>
      ) : (
        <div className="stories-feed-container">
          {stories.map((story) => {
            const authorName = story.user?.username || 'Community Member';
            const isOwner = user && (story.user?._id === user.id || story.user === user.id);
            const userReaction = story.reactions?.find(
              (r) => r.user === user?.id || r.user?._id === user?.id
            )?.emoji;

            // Calculate reaction counts breakdown
            const reactionCounts = {};
            (story.reactions || []).forEach((r) => {
              reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
            });
            const totalReactions = story.reactions?.length || 0;

            const songTitle = story.song?.title || 'Unknown Track';
            const songArtist = story.song?.artist?.username || 'Artist';
            const songBg = getArtworkBackground(story.song?._id || songTitle);

            return (
              <article key={story._id} className="story-card">
                {/* Story Card Header */}
                <div className="story-card-header">
                  <div className="story-author-info">
                    <div className="story-author-avatar">
                      <User size={18} />
                    </div>
                    <div className="story-author-meta">
                      <span className="story-author-name">{authorName}</span>
                      <span className="story-timestamp">
                        <Clock size={12} /> {formatTimeAgo(story.createdAt)}
                      </span>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      className="story-delete-btn"
                      onClick={() => handleDeleteStory(story._id)}
                      title="Delete your story"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Photograph */}
                <div className="story-photo-container">
                  <img
                    src={story.imageUrl}
                    alt={story.note || 'Song story memory'}
                    className="story-main-image"
                    loading="lazy"
                  />
                </div>

                {/* Personal Note */}
                {story.note && (
                  <div className="story-note-box">
                    <p className="story-note-text">"{story.note}"</p>
                  </div>
                )}

                {/* Attached Song Banner with Play Button */}
                {story.song && (
                  <div className="story-song-widget">
                    <div className="story-song-art" style={{ background: songBg }}>
                      <Music size={22} color="#fff" />
                    </div>
                    <div className="story-song-details">
                      <span className="story-song-title">{songTitle}</span>
                      <span className="story-song-artist">{songArtist}</span>
                    </div>
                    <button
                      type="button"
                      className="story-song-play-btn"
                      onClick={() => playSong(story.song)}
                      title={`Play ${songTitle}`}
                    >
                      <Play size={18} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
                      <span>Play Track</span>
                    </button>
                  </div>
                )}

                {/* Reaction Selector Bar */}
                <div className="story-reactions-bar">
                  <div className="emoji-button-row">
                    {EMOJI_OPTIONS.map(({ emoji, label }) => {
                      const count = reactionCounts[emoji] || 0;
                      const isSelected = userReaction === emoji;

                      return (
                        <button
                          key={emoji}
                          type="button"
                          className={`story-reaction-btn ${isSelected ? 'active-reacted' : ''}`}
                          onClick={() => handleReact(story._id, emoji)}
                          title={`${label} (${count})`}
                        >
                          <span className="emoji-icon">{emoji}</span>
                          {count > 0 && <span className="emoji-count">{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <span className="total-reactions-text">
                    {totalReactions > 0
                      ? `${totalReactions} ${totalReactions === 1 ? 'reaction' : 'reactions'}`
                      : 'Be the first to react'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      <CreateStoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStoryCreated={handleStoryCreated}
      />
    </div>
  );
}
