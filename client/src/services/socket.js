import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  const token = localStorage.getItem('spotify_token');

  if (!socket) {
    // If backend is on port 3000 and Vite proxies or direct:
    // In dev, connect to port 3000 directly or via window.location.origin
    const socketUrl = window.location.port === '5173' ? 'http://127.0.0.1:3000' : window.location.origin;

    socket = io(socketUrl, {
      auth: {
        token: token || '',
      },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  } else if (token && socket.auth?.token !== token) {
    socket.auth.token = token;
    socket.disconnect().connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
