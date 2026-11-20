import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('spotify_volume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [isLoading, setIsLoading] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [likedSongIds, setLikedSongIds] = useState(() => {
    try {
      const saved = localStorage.getItem('spotify_liked');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Audio setup and listeners
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        playNextTrack(true);
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setPlayerError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleError = (e) => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error('Audio playback error:', e);
      setPlayerError('Unable to play audio. The audio file might be unavailable or invalid.');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [repeatMode]);

  // Keep volume in sync
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;
    localStorage.setItem('spotify_volume', volume.toString());
  }, [volume, isMuted]);

  // Play a specific song and optionally update queue
  const playSong = async (song, newQueue = null) => {
    if (!song) return;

    setPlayerError(null);
    const audio = audioRef.current;

    if (!song.uri) {
      setPlayerError('No audio URL found for this track.');
      return;
    }

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const songIdx = newQueue.findIndex((s) => s._id === song._id);
      setCurrentIndex(songIdx !== -1 ? songIdx : 0);
    } else if (queue.length === 0) {
      setQueue([song]);
      setCurrentIndex(0);
    } else {
      const songIdx = queue.findIndex((s) => s._id === song._id);
      if (songIdx !== -1) {
        setCurrentIndex(songIdx);
      } else {
        setQueue((prev) => [...prev, song]);
        setCurrentIndex(queue.length);
      }
    }

    setCurrentSong(song);
    setIsLoading(true);

    try {
      if (audio.src !== song.uri) {
        audio.src = song.uri;
        audio.load();
      }
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Play error:', err);
      // If user hasn't interacted or autoplay blocked
      if (err.name !== 'AbortError') {
        setPlayerError(`Playback error: ${err.message || 'Audio could not be played'}`);
      }
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    if (!currentSong) {
      if (queue.length > 0) {
        return playSong(queue[0]);
      }
      return;
    }

    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        setPlayerError(`Playback error: ${err.message}`);
      }
    }
  };

  const playNextTrack = (fromAutoEnded = false) => {
    if (queue.length === 0) return;

    let nextIdx;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = currentIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all' || !fromAutoEnded) {
          nextIdx = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    setCurrentIndex(nextIdx);
    playSong(queue[nextIdx]);
  };

  const playPreviousTrack = () => {
    const audio = audioRef.current;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;

    let prevIdx;
    if (isShuffle) {
      prevIdx = Math.floor(Math.random() * queue.length);
    } else {
      prevIdx = currentIndex - 1;
      if (prevIdx < 0) {
        prevIdx = queue.length - 1;
      }
    }

    setCurrentIndex(prevIdx);
    playSong(queue[prevIdx]);
  };

  const seek = (time) => {
    const audio = audioRef.current;
    if (audio && !isNaN(time)) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeVolume = (newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleLike = (songId) => {
    setLikedSongIds((prev) => {
      let updated;
      if (prev.includes(songId)) {
        updated = prev.filter((id) => id !== songId);
      } else {
        updated = [...prev, songId];
      }
      localStorage.setItem('spotify_liked', JSON.stringify(updated));
      return updated;
    });
  };

  const isLiked = (songId) => likedSongIds.includes(songId);

  const clearError = () => setPlayerError(null);

  const value = {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    queue,
    currentIndex,
    isShuffle,
    repeatMode,
    isLoading,
    playerError,
    likedSongIds,
    playSong,
    togglePlay,
    playNext: () => playNextTrack(false),
    playPrevious: playPreviousTrack,
    seek,
    setVolume: changeVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    isLiked,
    clearError,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
