# VidTube - Production Grade Video Hosting Backend

VidTube is a robust backend system built with **Node.js** and **Express.js**, designed to handle high-traffic media management. It features secure authentication, complex data modeling with MongoDB, and seamless integration with third-party cloud services.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Storage:** Cloudinary (Images & Videos)
- **Security:** JWT (Access & Refresh Tokens) & Bcrypt
- **File Handling:** Multer

## ✨ Key Features

- **Stateless Auth:** Secure login/register with Refresh Token rotation.
- **Media Optimization:** Automatic image/video processing via Cloudinary CDN.
- **Atomic Operations:** Rollback mechanisms to ensure data consistency between the DB and cloud storage.
- **Aggregation Pipelines:** High-performance queries for user stats, watch history, and subscriber counts.

## 🛠️ Installation

1. Clone the repo: `git clone https://github.com/96SHUDH/VidTube-Backend.git`
2. Install dependencies: `npm install`
3. Configure `.env` with your MongoDB and Cloudinary credentials.
4. Start the server: `npm run dev`

## 👨‍💻 Author

**96SHUDH** - [GitHub Profile](https://github.com/96SHUDH)
