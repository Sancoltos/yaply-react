const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (for simplicity - use a database in production)
let users = {}; // { username: { password: hashedPassword, avatar: filename } }
let channels = { 
    general: [], 
    sports: [], 
    "video-games": [],
    "deep-talks": [],
    anime: [],
    "study-zone": [],
    movies: [],
    novels: [],
    fashion: [],
    announcement: [],
    advertising: [],
    programming: []
};

let onlineUsers = new Map(); // Store online users and their avatars

// User signup endpoint
app.post("/signup", async (req, res) => {
    const { username, password, avatar } = req.body;

    if (users[username]) {
        return res.status(400).send({ message: "Username already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = {
        password: hashedPassword,
        avatar: avatar || 'default-avatar.png'
    };
    res.send({ message: "User registered successfully!", username });
});

// User login endpoint
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!users[username]) {
        return res.status(404).send({ message: "User not found!" });
    }

    const isValid = await bcrypt.compare(password, users[username].password);
    if (isValid) {
        return res.send({ 
            message: "Login successful!", 
            username,
            avatar: users[username].avatar 
        });
    } else {
        return res.status(401).send({ message: "Invalid credentials!" });
    }
});

// Socket.io real-time communication
io.on("connection", (socket) => {
    let currentUser = null;

    socket.on("user-connected", (data) => {
        currentUser = data.username;
        onlineUsers.set(currentUser, {
            socketId: socket.id,
            avatar: data.avatar || 'default-avatar.png'
        });
        io.emit("update-online-users", Array.from(onlineUsers.entries()));
    });

    socket.on("disconnect", () => {
        if (currentUser) {
            onlineUsers.delete(currentUser);
            io.emit("update-online-users", Array.from(onlineUsers.entries()));
        }
    });

    socket.on("joinChannel", (channel) => {
        // Leave all other channels
        socket.rooms.forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
            }
        });
        
        socket.join(channel);
        const channelMessages = channels[channel] || [];
        socket.emit("channelMessages", channelMessages);
    });

    socket.on("sendMessage", (data) => {
        const { channel, message, username } = data;
        
        const messageObj = {
            username,
            message,
            timestamp: new Date().toISOString()
        };

        // Store message
        channels[channel] = channels[channel] || [];
        channels[channel].push(messageObj);
        
        // Limit stored messages (optional)
        if (channels[channel].length > 100) {
            channels[channel] = channels[channel].slice(-100);
        }

        // Broadcast to everyone in the channel
        io.to(channel).emit("newMessage", messageObj);
    });

    socket.on("private-message", (data) => {
        const targetUser = onlineUsers.get(data.to);
        if (targetUser) {
            io.to(targetUser.socketId).emit("private-message", {
                from: currentUser,
                message: data.message
            });
        }
    });
});

// Serve frontend
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});