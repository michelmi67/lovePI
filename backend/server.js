// server.js (consolidated and corrected version)
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// File paths
const likesPath = path.join(__dirname, 'likes.json');
const matchesPath = path.join(__dirname, 'matches.json');
const profilesPath = path.join(__dirname, 'profiles.json');
const messagesPath = path.join(__dirname, 'messages.json');

// Initialize files if they don't exist
if (!fs.existsSync(likesPath)) fs.writeFileSync(likesPath, JSON.stringify({}));
if (!fs.existsSync(matchesPath)) fs.writeFileSync(matchesPath, JSON.stringify({}));
if (!fs.existsSync(profilesPath)) fs.writeFileSync(profilesPath, JSON.stringify({}));
if (!fs.existsSync(messagesPath)) fs.writeFileSync(messagesPath, JSON.stringify({}));

// Save profile
app.post("/api/save_profile", (req, res) => {
  const { username, bio, age, gender, photo } = req.body;
  if (!username) return res.status(400).json({ error: "Username manquant" });

  const profiles = JSON.parse(fs.readFileSync(profilesPath));
  profiles[username] = { bio, age, gender, photo };
  fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
  res.json({ success: true });
});

// Get profile by username
app.get("/api/profile/:username", (req, res) => {
  const profiles = JSON.parse(fs.readFileSync(profilesPath));
  res.json(profiles[req.params.username] || {});
});

// Get all profiles
app.get("/api/all_profiles", (req, res) => {
  const profiles = JSON.parse(fs.readFileSync(profilesPath));
  res.json(profiles);
});

// Like API with match detection
app.post("/api/like", (req, res) => {
  const { from, to } = req.body;
  const likes = JSON.parse(fs.readFileSync(likesPath));
  const matches = JSON.parse(fs.readFileSync(matchesPath));

  if (!likes[from]) likes[from] = [];
  if (!likes[from].includes(to)) likes[from].push(to);
  fs.writeFileSync(likesPath, JSON.stringify(likes, null, 2));

  const isMutual = likes[to]?.includes(from);
  if (isMutual) {
    if (!matches[from]) matches[from] = [];
    if (!matches[to]) matches[to] = [];
    if (!matches[from].includes(to)) matches[from].push(to);
    if (!matches[to].includes(from)) matches[to].push(from);
    fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2));
  }
  res.json({ success: true, match: isMutual });
});

// Get matches for a user
app.get("/api/matches/:username", (req, res) => {
  const matches = JSON.parse(fs.readFileSync(matchesPath));
  res.json(matches[req.params.username] || []);
});

// Messaging API - save and load messages
app.post("/api/message", (req, res) => {
  const { from, to, text } = req.body;
  if (!from || !to || !text) return res.status(400).json({ success: false, error: "Missing field" });

  const messages = JSON.parse(fs.readFileSync(messagesPath));
  const key = [from, to].sort().join("__");
  if (!messages[key]) messages[key] = [];
  messages[key].push({ from, text, time: Date.now() });
  fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
  res.json({ success: true });
});

app.get("/api/messages/:user1/:user2", (req, res) => {
  const messages = JSON.parse(fs.readFileSync(messagesPath));
  const key = [req.params.user1, req.params.user2].sort().join("__");
  res.json(messages[key] || []);
});

// Socket.IO for real-time chat
const liveMessages = {};
io.on("connection", (socket) => {
  console.log("✅ New client connected");

  socket.on("join", ({ username }) => {
    socket.username = username;
    socket.join(username);
  });

  socket.on("private_message", ({ from, to, text }) => {
    const key = [from, to].sort().join("_");
    if (!liveMessages[key]) liveMessages[key] = [];
    liveMessages[key].push({ from, to, text });
    io.to(to).emit("private_message", { from, text });
  });
});

server.listen(PORT, () => {
  console.log("🚀 Server running on http://localhost:" + PORT);
});
