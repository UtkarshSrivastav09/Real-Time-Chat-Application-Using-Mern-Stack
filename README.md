# 💬 Nexus Chat - Real-Time MERN Stack Application

Nexus Chat is a high-performance, industry-grade real-time chat application built using the MERN stack. It features a modern, glassmorphic UI/UX and seamless communication capabilities.

![Nexus Chat Banner](https://github-production-user-asset-6210df.s3.amazonaws.com/your-image-url-here.png)

## ✨ Features

- **Real-Time Messaging**: Instant message delivery using Socket.io.
- **Secure Authentication**: JWT-based authentication with password hashing using Bcrypt.
- **Modern UI**: Sleek glassmorphic design built with Tailwind CSS 4 and Framer Motion for smooth animations.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop screens.
- **Message History**: Persistent chat history stored in MongoDB.
- **Typing Indicators**: Real-time feedback when someone is typing.
- **Presence Tracking**: See who's online in real-time.

## 🚀 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Real-time**: [Socket.io Client](https://socket.io/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Auth**: [JWT (JSON Web Tokens)](https://jwt.io/) & [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/UtkarshSrivastav09/Real-Time-Chat-Application-Using-Mern-Stack.git
   cd Real-Time-Chat-Application-Using-Mern-Stack
   ```

2. **Backend Setup**:
   - Navigate to the server directory:
     ```bash
     cd server
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Create a `.env` file and add your environment variables:
     ```env
     PORT=5000
     MONGO_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret
     ```
   - Start the server:
     ```bash
     npm start
     ```

3. **Frontend Setup**:
   - Navigate back to the root directory:
     ```bash
     cd ..
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```

## 👨‍💻 Author

**Utkarsh Srivastav**
- GitHub: [@UtkarshSrivastav09](https://github.com/UtkarshSrivastav09)

---

Developed with ❤️ by [Utkarsh Srivastav](https://github.com/UtkarshSrivastav09)
