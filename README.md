# Spotify Clone – Music Streaming & Social Listening Platform

A full-stack Spotify-inspired music streaming platform that combines music discovery and listening with social interaction. Built using modern web technologies, the application allows users to explore music, create albums, and connect with friends through interactive listening experiences.

Along with core Spotify-like functionality, the platform introduces two social features: **Virtual Listening Rooms** and **Song Stories**, making music sharing and discovery more interactive and personal.

## 🚀 Features

### 🎵 Core Music Streaming Features
- User Registration and Login
- JWT-based Authentication
- Cookie-based token handling
- Role-based authorization for users and artists
- Music upload functionality
- Album creation and management
- Browse and access all available music
- Retrieve all albums
- Get individual albums by ID
- Protected APIs for authenticated users
- File upload handling using Multer
- Cloud-based file storage using ImageKit

### 🎧 Virtual Listening Rooms

Listen to music together with friends in real time!

- Create and join virtual listening rooms.
- Listen to the same song simultaneously with other participants.
- Chat with friends while listening.
- React and interact with other participants.
- Control a shared music queue.
- Enjoy a collaborative music-listening experience.

### 📸 Song Stories

Share the memories and emotions associated with your favourite songs!

- Share songs along with photographs.
- Add personal notes, thoughts, or memories to a song.
- Allow friends to discover the music behind shared moments.
- React to other users' Song Stories.
- Create a more personal and interactive music-sharing experience.

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication & Security
- JWT (JSON Web Token)
- bcrypt
- cookie-parser
- Role-based authorization

### File Handling & Storage
- Multer
- ImageKit

### Configuration
- dotenv

## 📂 Project Structure

```text
Spotify-Clone/
│
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── music.controller.js
│   │
│   ├── db/
│   │   └── db.js
│   │
│   ├── middlewares/
│   │   └── auth.middleware.js
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── music.model.js
│   │   └── album.model.js
│   │
│   ├── routes/
│   │   ├── auth.route.js
│   │   └── music.route.js
│   │
│   ├── services/
│   │   └── storage.service.js
│   │
│   └── app.js
│
├── .env
├── .gitignore
├── package.json
├── server.js
└── README.md
```

*Note: Update the project structure above if your current implementation contains additional folders or modules for Listening Rooms and Song Stories.*

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

### 2. Navigate to the project directory

```bash
cd Spotify-Clone
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the root directory and configure the required variables:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
```

Add any additional environment variables required by your implementation.

### 5. Start the server

```bash
npm start
```

## 🔐 Security

- Password hashing using bcrypt.
- JWT-based authentication.
- Protected routes using authentication middleware.
- Role-based access control.
- Environment variables for sensitive configuration.

## 🌟 Project Highlights

This project extends the traditional music streaming experience by introducing social and collaborative functionality.

| Feature | Purpose |
|---|---|
| Music Streaming | Browse and access music |
| Artist & Album Management | Upload music and organize albums |
| Virtual Listening Rooms | Listen, chat, react, and manage a shared queue with friends |
| Song Stories | Share songs with photographs and personal memories |
| Authentication | Secure user access and authorization |

## 🔮 Future Enhancements

- AI-powered music recommendations.
- Mood-based playlists.
- Music compatibility between friends.
- Personalized listening statistics.
- Enhanced music discovery.

## 👩‍💻 Author

Developed as a Spotify-inspired music streaming and social listening platform.
