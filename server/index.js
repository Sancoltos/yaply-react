const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

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
app.use(express.static(path.join(__dirname, '../public')));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Database simulation
const users = new Map();
const channels = {
    general: [], sports: [], "video-games": [], "deep-talks": [],
    anime: [], "study-zone": [], politics: [], movies: [],
    novels: [], fashion: [], announcement: [], advertising: [], programming: []
};
const onlineUsers = new Map();

// Ensure avatar directory exists
const avatarDir = path.join(__dirname, '../public/avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
    fs.writeFileSync(path.join(avatarDir, 'manifest.json'), JSON.stringify({
        avatars: ["default-avatar.png"]
    }));
}

// Auth Endpoints
app.post("/signup", async (req, res) => {
    console.log("Signup request received:", req.body);
    try {
        const { username, password, avatar = 'default-avatar.png' } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password required" });
        }

        if (users.has(username)) {
            return res.status(409).json({ success: false, message: "Username taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        users.set(username, { password: hashedPassword, avatar });
        
        res.status(201).json({ 
            success: true, 
            message: "Signup successful",
            username,
            avatar
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post("/login", async (req, res) => {
    console.log("Login request received:", req.body);
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password required" });
        }

        const user = users.get(username);
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        res.json({ 
            success: true,
            message: "Login successful",
            username,
            avatar: user.avatar
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Socket.io
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

    // ... (rest of your socket.io code)
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});