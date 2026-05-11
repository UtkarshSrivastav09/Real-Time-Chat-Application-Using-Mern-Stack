const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection with Retry Logic
let dbConnected = false;
const connectWithRetry = () => {
    console.log('⏳ Attempting to connect to MongoDB...');
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-clone', {
        serverSelectionTimeoutMS: 10000, // Increased to 10s
    })
    .then(() => {
        console.log('✅ Connected to MongoDB Successfully');
        dbConnected = true;
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        console.log('🔄 Retrying in 5 seconds... (Falling back to in-memory mode temporarily)');
        dbConnected = false;
        setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Root Route - Connection Status
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0b141a; color: white;">
            <h1 style="color: #00a884;">✅ Nexus API is Connected</h1>
            <p>Database Status: <span style="color: ${dbConnected ? '#00a884' : '#ff5252'}">${dbConnected ? 'CONNECTED' : 'FALLBACK (RETRYING...)'}</span></p>
            <p style="font-size: 0.8rem; color: #8696a0;">Server Time: ${new Date().toLocaleString()}</p>
        </div>
    `);
});

// Health Check & Anti-Sleep Endpoint
app.get('/api/ping', (req, res) => {
    res.json({ 
        status: 'online', 
        database: dbConnected ? 'connected' : 'fallback_mode',
        timestamp: new Date().toISOString() 
    });
});

// In-memory fallback data
const memoryUsers = [];
const memoryMessages = [];

// API Endpoints
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, avatar, mode } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }

        if (dbConnected) {
            let user = await User.findOne({ username });
            
            if (mode === 'signup') {
                if (user) return res.status(400).json({ error: "User already exists" });
                const hashedPassword = await bcrypt.hash(password, 10);
                user = new User({ username, password: hashedPassword, avatar, isOnline: true });
                await user.save();
                io.emit('newUser', user);
            } else {
                if (!user || !user.password) {
                    return res.status(401).json({ error: "Account setup required or invalid credentials" });
                }
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return res.status(401).json({ error: "Incorrect password" });
                
                user.isOnline = true;
                user.lastSeen = Date.now();
                await user.save();
            }
            res.json(user);
        } else {
            // Memory fallback (Simplified)
            let user = memoryUsers.find(u => u.username === username);
            if (!user) {
                user = { _id: Date.now().toString(), username, avatar, isOnline: true, lastSeen: Date.now() };
                memoryUsers.push(user);
                io.emit('newUser', user);
            }
            res.json(user);
        }
    } catch (err) {
        console.error("Auth error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        if (dbConnected) {
            const users = await User.find();
            res.json(users);
        } else {
            res.json(memoryUsers);
        }
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        if (dbConnected) {
            await User.findByIdAndDelete(userId);
            await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
        } else {
            const uIndex = memoryUsers.findIndex(u => u._id === userId);
            if (uIndex !== -1) memoryUsers.splice(uIndex, 1);
            
            // Filter messages in memory
            const remainingMessages = memoryMessages.filter(m => {
                const sid = typeof m.sender === 'object' ? m.sender._id : m.sender;
                return sid !== userId && m.receiver !== userId;
            });
            memoryMessages.length = 0;
            memoryMessages.push(...remainingMessages);
        }
        io.emit('userDeleted', userId);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error('Delete User Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        if (dbConnected) {
            const messages = await Message.find().populate('sender');
            res.json(messages);
        } else {
            res.json(memoryMessages);
        }
    } catch (err) {
        console.error('Get Messages Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/messages/:id', async (req, res) => {
    try {
        const messageId = req.params.id;
        if (dbConnected) {
            await Message.findByIdAndDelete(messageId);
        } else {
            const index = memoryMessages.findIndex(m => m._id === messageId);
            if (index !== -1) memoryMessages.splice(index, 1);
        }
        io.emit('messageDeleted', messageId);
        res.json({ message: "Message deleted successfully" });
    } catch (err) {
        console.error('Delete Message Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/messages/read/:senderId', async (req, res) => {
    try {
        const { senderId } = req.params;
        const { receiverId } = req.body; // The current user

        if (dbConnected) {
            await Message.updateMany(
                { sender: senderId, receiver: receiverId, status: { $ne: 'read' } },
                { status: 'read' }
            );
        } else {
            memoryMessages.forEach(m => {
                const sid = typeof m.sender === 'object' ? m.sender._id : m.sender;
                if (sid === senderId && m.receiver === receiverId) {
                    m.status = 'read';
                }
            });
        }
        io.emit('messagesRead', { senderId, receiverId });
        
        // Specifically notify the sender that their messages were read
        io.to(senderId).emit('messageStatusUpdate', { readerId: receiverId });
        
        res.json({ message: "Messages marked as read" });
    } catch (err) {
        console.error('Mark Read Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', async (userId) => {
        socket.join(userId);
        if (dbConnected) {
            await User.findByIdAndUpdate(userId, { isOnline: true });
        } else {
            const user = memoryUsers.find(u => u._id === userId);
            if (user) user.isOnline = true;
        }
        io.emit('userStatusUpdate', { userId, isOnline: true });
    });

    socket.on('sendMessage', async (data) => {
        const { senderId, receiverId, text } = data;
        let populatedMsg;

        // Ensure IDs are strings for room matching
        const sId = senderId.toString();
        const rId = receiverId.toString();

        if (dbConnected) {
            const newMessage = new Message({
                sender: sId,
                receiver: rId,
                text,
                status: 'sent'
            });
            await newMessage.save();
            populatedMsg = await newMessage.populate('sender');
        } else {
            const sender = memoryUsers.find(u => u._id === senderId);
            populatedMsg = {
                _id: Date.now().toString(),
                sender: sender || senderId,
                receiver: receiverId,
                text,
                status: 'sent',
                createdAt: new Date().toISOString()
            };
            memoryMessages.push(populatedMsg);
        }
        
        if (rId === 'global') {
            io.emit('newMessage', populatedMsg);
        } else {
            io.to(rId).to(sId).emit('newMessage', populatedMsg);
        }
    });
    
    socket.on('typing', ({ senderId, receiverId }) => {
        io.to(receiverId).emit('userTyping', { userId: senderId });
    });

    socket.on('stopTyping', ({ senderId, receiverId }) => {
        io.to(receiverId).emit('userStoppedTyping', { userId: senderId });
    });

    socket.on('addReaction', async (data) => {
        const { messageId, emoji, userId } = data;
        if (dbConnected) {
            const msg = await Message.findById(messageId);
            if (msg) {
                if (!msg.reactions) msg.reactions = new Map();
                const users = msg.reactions.get(emoji) || [];
                if (!users.includes(userId)) {
                    users.push(userId);
                    msg.reactions.set(emoji, users);
                    await msg.save();
                    io.emit('reactionUpdate', { messageId, reactions: msg.reactions });
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Self-ping mechanism to prevent sleeping on free hosting (Render/Railway/etc)
    const selfPing = () => {
        const url = process.env.SERVER_URL || `http://localhost:${PORT}`;
        if (url.includes('localhost') && !process.env.SERVER_URL) return; // Don't self-ping on local dev unless forced

        setInterval(() => {
            http.get(`${url}/api/ping`, (res) => {
                console.log(`📡 Self-ping successful: ${res.statusCode}`);
            }).on('error', (err) => {
                console.warn(`⚠️ Self-ping failed (Check SERVER_URL): ${err.message}`);
            });
        }, 14 * 60 * 1000); // Every 14 minutes
    };
    
    selfPing();
});
