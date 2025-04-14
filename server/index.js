const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
    origin: ["http://localhost:3000", "https://yaply-zecq.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
};

const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true
});

app.use(cors(corsOptions));
app.use(express.json());

// Initialize data structures
const users = new Map();
const channels = {
    general: [], sports: [], "video-games": [], "deep-talks": [],
    anime: [], "study-zone": [], politics: [], movies: [],
    novels: [], fashion: [], announcement: [], advertising: [], programming: []
};
const onlineUsers = new Map();

// Initialize avatar directory
const avatarDir = path.join(__dirname, '../public/avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
    fs.writeFileSync(path.join(avatarDir, 'manifest.json'), JSON.stringify({
        avatars: ["default-avatar.png"]
    }));
}

// API routes
const router = express.Router();

router.post("/signup", async (req, res) => {
    console.log("Signup request received:", req.body);
    try {
        const { username, password, avatar = 'default-avatar.png' } = req.body;
        
        if (!username || !password) {
            console.log("Missing username or password");
            return res.status(400).json({ success: false, message: "Username and password required" });
        }

        if (users.has(username)) {
            console.log("Username already taken:", username);
            return res.status(409).json({ success: false, message: "Username taken" });
        }

        console.log("Hashing password for user:", username);
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed successfully");
        
        users.set(username, { password: hashedPassword, avatar });
        console.log("User created successfully:", username);
        
        res.status(201).json({ 
            success: true, 
            message: "Signup successful",
            username,
            avatar
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error",
            error: error.message 
        });
    }
});

router.post("/login", async (req, res) => {
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

// Mount API routes
app.use("/api", router);

// Socket.IO events
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    let currentUser = null;
    let currentChannel = 'general';

    socket.on("user-connected", (data) => {
        console.log("User connected:", data);
        currentUser = data.username;
        onlineUsers.set(currentUser, {
            socketId: socket.id,
            avatar: data.avatar || 'default-avatar.png'
        });
        
        // Broadcast updated online users list to all clients
        io.emit("update-online-users", Array.from(onlineUsers.entries()));
        console.log("Online users:", Array.from(onlineUsers.entries()));
        
        // Send initial messages for the current channel
        socket.emit("channelMessages", channels[currentChannel]);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", currentUser);
        if (currentUser) {
            onlineUsers.delete(currentUser);
            // Broadcast updated online users list to all clients
            io.emit("update-online-users", Array.from(onlineUsers.entries()));
        }
    });

    socket.on("joinChannel", (channel) => {
        console.log("User joining channel:", currentUser, "->", channel);
        currentChannel = channel;
        socket.emit("channelMessages", channels[channel]);
    });

    socket.on("sendMessage", (message) => {
        console.log("Received message:", message);
        if (!currentUser) {
            console.log("No current user, ignoring message");
            return;
        }

        const newMessage = {
            username: currentUser,
            message: message.message,
            timestamp: new Date().toISOString(),
            channel: message.channel
        };

        console.log("Creating new message:", newMessage);

        if (!channels[message.channel]) {
            console.log("Channel doesn't exist:", message.channel);
            return;
        }

        channels[message.channel].push(newMessage);
        console.log("Message added to channel. Current messages:", channels[message.channel]);

        // Broadcast the new message to all connected clients
        io.emit("newMessage", newMessage);
        console.log("Message broadcasted to all clients");
    });
});

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, '../build')));

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});