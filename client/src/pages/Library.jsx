import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Library, Disc3, Music, Heart } from 'lucide-react';
import { musicAPI } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import MusicCard from '../components/MusicCard';
import AlbumCard from '../components/AlbumCard';

export default function LibraryPage({ onOpenUpload }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [musics, setMusics] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  const { likedSongIds } = usePlayer();

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'all');
  }, [searchParams]);

  const setTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    async function loadLibrary() {
      setLoading(true);
      try {
        const [musicRes, albumRes] = await Promise.allSettled([
          musicAPI.getAllMusics({ limit: 100 }),
          musicAPI.getAllAlbums(),
        ]);
        if (musicRes.status === 'fulfilled') {
          setMusics(musicRes.value.data?.musics || []);
        }
        if (albumRes.status === 'fulfilled') {
          setAlbums(albumRes.value.data?.albums || []);
        }
      } catch (err) {
        console.error('Error fetching library:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, []);

  const likedSongs = musics.filter((s) => likedSongIds.includes(s._id));

  return (
    <div className="spotify-page-container">
      {/* Library Header */}
      <div className="library-header-row">
        <div className="library-title-wrap">
          <Library size={32} color="#1db954" />
          <h1 className="section-title" style={{ margin: 0, fontSize: '2rem' }}>
            Your Library
          </h1>
        </div>

        {/* Tab Filters */}
        <div className="library-filter-pills">
          <button
            type="button"
            className={`filter-pill ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            All Items
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'albums' ? 'active' : ''}`}
            onClick={() => setTab('albums')}
          >
            Albums ({albums.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'songs' ? 'active' : ''}`}
            onClick={() => setTab('songs')}
          >
            Songs ({musics.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === 'liked' ? 'active' : ''}`}
            onClick={() => setTab('liked')}
          >
            Liked ({likedSongs.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spotify-loading-container">
          <div className="spotify-spinner" />
          <p>Loading your library collection...</p>
        </div>
      ) : (
        <div className="library-content-area">
          {/* Liked Songs Tab */}
          {activeTab === 'liked' && (
            <section className="spotify-section">
              <h2 className="section-title">Liked Songs ({likedSongs.length})</h2>
              {likedSongs.length === 0 ? (
                <div className="spotify-empty-state">
                  <Heart size={44} color="#727272" />
                  <h3>Songs you like will appear here</h3>
                  <p>Save songs by tapping the heart icon in the music player or tracks.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {likedSongs.map((song) => (
                    <MusicCard key={song._id} song={song} queue={likedSongs} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Albums Tab or All */}
          {(activeTab === 'all' || activeTab === 'albums') && (
            <section className="spotify-section">
              <h2 className="section-title">Albums ({albums.length})</h2>
              {albums.length === 0 ? (
                <div className="spotify-empty-state">
                  <Disc3 size={44} color="#727272" />
                  <p>No albums found in library.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {albums.map((album) => (
                    <AlbumCard key={album._id} album={album} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Songs Tab or All */}
          {(activeTab === 'all' || activeTab === 'songs') && (
            <section className="spotify-section">
              <h2 className="section-title">Songs ({musics.length})</h2>
              {musics.length === 0 ? (
                <div className="spotify-empty-state">
                  <Music size={44} color="#727272" />
                  <p>No songs found in library.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {musics.map((song) => (
                    <MusicCard key={song._id} song={song} queue={musics} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
