import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MusicPlayer from './components/MusicPlayer';
import UploadModal from './components/UploadModal';

import Home from './pages/Home';
import SearchPage from './pages/Search';
import AlbumDetails from './pages/AlbumDetails';
import LibraryPage from './pages/Library';
import ListeningRooms from './pages/ListeningRooms';
import ActiveListeningRoom from './pages/ActiveListeningRoom';
import SongStories from './pages/SongStories';
import Login from './pages/Login';
import Register from './pages/Register';

function AppLayout({ onOpenUpload }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  return (
    <div className="spotify-app-layout">
      {/* Top and Center: Sidebar + Main Content */}
      <div className="spotify-main-wrapper">
        <Sidebar onOpenUpload={onOpenUpload} />

        <div className="spotify-main-content">
          <Navbar onOpenUpload={onOpenUpload} />
          <main className="spotify-scroll-view">
            <Routes>
              <Route path="/" element={<Home onOpenUpload={onOpenUpload} />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/album/:albumId" element={<AlbumDetails />} />
              <Route path="/library" element={<LibraryPage onOpenUpload={onOpenUpload} />} />
              <Route path="/rooms" element={<ListeningRooms />} />
              <Route path="/room/:roomCode" element={<ActiveListeningRoom />} />
              <Route path="/stories" element={<SongStories />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Always Visible Global Music Player */}
      <MusicPlayer />
    </div>
  );
}

export default function App() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <AppLayout onOpenUpload={() => setIsUploadOpen(true)} />
          <UploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onSongUploaded={() => {
              // Trigger reload or notification
            }}
          />
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
