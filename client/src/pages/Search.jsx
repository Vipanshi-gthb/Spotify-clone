import React, { useState, useEffect, useMemo } from 'react';
import { Search, Music, Disc3, User, Sparkles } from 'lucide-react';
import { musicAPI } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import SearchBar from '../components/SearchBar';
import MusicCard from '../components/MusicCard';
import AlbumCard from '../components/AlbumCard';
import { getArtworkBackground } from '../utils/artwork';

export default function SearchPage() {
  const { playSong } = usePlayer();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'songs' | 'albums' | 'artists'
  const [musics, setMusics] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
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
        console.error('Failed to load search data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter songs and albums based on query
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { songs: [], albums: [], topResult: null };
    }

    const matchedSongs = musics.filter((song) => {
      const matchTitle = song.title?.toLowerCase().includes(q);
      const artistName =
        typeof song.artist === 'object' && song.artist?.username
          ? song.artist.username.toLowerCase()
          : '';
      return matchTitle || artistName.includes(q);
    });

    const matchedAlbums = albums.filter((album) => {
      const matchTitle = album.title?.toLowerCase().includes(q);
      const artistName =
        typeof album.artist === 'object' && album.artist?.username
          ? album.artist.username.toLowerCase()
          : '';
      return matchTitle || artistName.includes(q);
    });

    // Top result priority: exact song match, or first matched song, or album
    let top = null;
    if (matchedSongs.length > 0) {
      top = { type: 'song', data: matchedSongs[0] };
    } else if (matchedAlbums.length > 0) {
      top = { type: 'album', data: matchedAlbums[0] };
    }

    return {
      songs: matchedSongs,
      albums: matchedAlbums,
      topResult: top,
    };
  }, [query, musics, albums]);

  const hasResults = searchResults.songs.length > 0 || searchResults.albums.length > 0;

  return (
    <div className="spotify-page-container">
      {/* Search Bar Input */}
      <div className="search-header-area">
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          placeholder="What do you want to listen to? (Songs, Artists, Albums)"
        />

        {query.trim() && (
          <div className="search-filter-pills">
            <button
              type="button"
              className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-pill ${filterType === 'songs' ? 'active' : ''}`}
              onClick={() => setFilterType('songs')}
            >
              Songs ({searchResults.songs.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterType === 'albums' ? 'active' : ''}`}
              onClick={() => setFilterType('albums')}
            >
              Albums ({searchResults.albums.length})
            </button>
          </div>
        )}
      </div>

      {/* Main Search View */}
      {loading ? (
        <div className="spotify-loading-container">
          <div className="spotify-spinner" />
          <p>Searching catalog...</p>
        </div>
      ) : !query.trim() ? (
        /* Empty / Browse Prompt */
        <div className="search-browse-section">
          <h2 className="section-title">Browse all</h2>
          <div className="browse-cards-grid">
            <div
              className="browse-category-card"
              style={{ background: 'linear-gradient(135deg, #E13300 0%, #741000 100%)' }}
              onClick={() => setQuery('test')}
            >
              <span className="cat-title">Pop & Hits</span>
              <Music size={48} className="cat-icon" />
            </div>
            <div
              className="browse-category-card"
              style={{ background: 'linear-gradient(135deg, #1E3264 0%, #0F1C38 100%)' }}
              onClick={() => setQuery('title')}
            >
              <span className="cat-title">Top Tracks</span>
              <Disc3 size={48} className="cat-icon" />
            </div>
            <div
              className="browse-category-card"
              style={{ background: 'linear-gradient(135deg, #8D67AB 0%, #463355 100%)' }}
              onClick={() => setQuery('artist')}
            >
              <span className="cat-title">Indie & Chill</span>
              <Sparkles size={48} className="cat-icon" />
            </div>
            <div
              className="browse-category-card"
              style={{ background: 'linear-gradient(135deg, #006450 0%, #003228 100%)' }}
              onClick={() => setQuery('album')}
            >
              <span className="cat-title">New Albums</span>
              <User size={48} className="cat-icon" />
            </div>
          </div>
        </div>
      ) : !hasResults ? (
        /* No Match Found */
        <div className="spotify-empty-state">
          <Search size={44} color="#727272" />
          <h3>No results found for "{query}"</h3>
          <p>Please make sure your words are spelled correctly or use fewer keywords.</p>
        </div>
      ) : (
        /* Results View */
        <div className="search-results-layout">
          {/* Top Result + Songs split layout (Spotify desktop style) */}
          {filterType === 'all' && searchResults.topResult && (
            <div className="search-top-row">
              {/* Top Result Card */}
              <div className="top-result-col">
                <h3 className="section-title">Top result</h3>
                <div
                  className="top-result-card"
                  onClick={() => {
                    if (searchResults.topResult.type === 'song') {
                      playSong(searchResults.topResult.data, searchResults.songs);
                    }
                  }}
                >
                  <div
                    className="top-result-artwork"
                    style={{
                      background: getArtworkBackground(
                        searchResults.topResult.data._id || searchResults.topResult.data.title
                      ),
                    }}
                  >
                    <Music size={54} color="#fff" />
                  </div>
                  <h2 className="top-result-title">
                    {searchResults.topResult.data.title}
                  </h2>
                  <div className="top-result-meta">
                    <span className="top-badge">
                      {searchResults.topResult.type === 'song' ? 'Song' : 'Album'}
                    </span>
                    <span className="top-artist">
                      {searchResults.topResult.data.artist?.username || 'Artist'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Matching Songs list beside top result */}
              <div className="search-songs-col">
                <h3 className="section-title">Songs</h3>
                <div className="search-songs-list">
                  {searchResults.songs.slice(0, 4).map((song) => {
                    const bg = getArtworkBackground(song._id || song.title);
                    const artist = song.artist?.username || 'Artist';
                    return (
                      <div
                        key={song._id}
                        className="search-song-row"
                        onClick={() => playSong(song, searchResults.songs)}
                      >
                        <div className="row-art" style={{ background: bg }}>
                          <Music size={18} color="#fff" />
                        </div>
                        <div className="row-info">
                          <span className="row-title">{song.title}</span>
                          <span className="row-artist">{artist}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Songs Grid */}
          {(filterType === 'all' || filterType === 'songs') && searchResults.songs.length > 0 && (
            <section className="spotify-section">
              <h2 className="section-title">Songs</h2>
              <div className="cards-grid">
                {searchResults.songs.map((song) => (
                  <MusicCard
                    key={song._id}
                    song={song}
                    queue={searchResults.songs}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Albums Grid */}
          {(filterType === 'all' || filterType === 'albums') && searchResults.albums.length > 0 && (
            <section className="spotify-section">
              <h2 className="section-title">Albums</h2>
              <div className="cards-grid">
                {searchResults.albums.map((album) => (
                  <AlbumCard key={album._id} album={album} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
