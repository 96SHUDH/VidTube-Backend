VidTube Backend:-

A production-ready YouTube-like backend built with Node.js, Express, and MongoDB. This project implements complex features like video processing, user authentication, social interactions (likes/comments), and real-time updates via WebSockets.

Features:-

User Management: Registration, login, logout, and profile management using JWT authentication.

Video Handling: Secure video uploads, thumbnail management, and streaming integration.

Social Interaction: Systems for liking videos, commenting, and "Tweet" style status updates.

Subscription System: Channel follow/unfollow logic with subscriber tracking.

Playlists & Dashboard: Create and manage video playlists and view channel analytics.

Real-time Updates: Integrated socket.js for live interactions.

🛠 Tech Stack:-
Runtime: Node.js

Framework: Express.js

Database: MongoDB (via Mongoose)

Authentication: JWT & Bcrypt

File Handling: Multer & Cloudinary

Real-time: Socket.io

Folder Structure:-
src/
├── controllers/ # Request handling & business logic
├── db/ # Database connection setup
├── middlewares/ # Auth, Multer, and error handling
├── models/ # Mongoose schemas (User, Video, comment,like,tweet,etc.)
├── routes/ # API endpoint definitions
├── utils/ # API response/ApiError asyncHandler & Cloudinary.ja
├── app.js # Express app configuration
├── index.js # Entry point & server listener
└── socket.js # WebSocket implementation

⚙️ Setup Instructions

1. Install Dependencies:
   npm install.

2. Environment Variables: Create a .env file in the root directory (refer to .env.sample) and add:

PORT

MONGODB_URI

ACCESS_TOKEN_SECRET

CLOUDINARY_CLOUD_NAME

CLOUDINARY_API_KEY

CLOUDINARY_API_SECRET

3. Run the Server:

# Development mode

npm run dev

# Production mode

npm start

API Endpoints (Quick Reference)

Category Endpoint Description
User /api/v1/users/register Register a new user
Video /api/v1/videos/ Upload and manage videos
Likes /api/v1/likes/ Toggle likes on videos/comments
Subscriptions /api/v1/subscriptions/ Handle channel follows
