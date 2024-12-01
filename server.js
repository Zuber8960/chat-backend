const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require('dotenv').config();


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity, adjust for production
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());

// Serve basic status endpoint
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Multiplayer player data store
let players = {};

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Add new player
  players[socket.id] = { x: 0, y: 0, name: `Player_${socket.id.slice(0, 5)}` };

  // Notify all players about the new player
  io.emit("playerList", players);

  // Handle player movement
  socket.on("playerMove", (data) => {
    if (players[socket.id]) {
      players[socket.id].x += data.dx || 0;
      players[socket.id].y += data.dy || 0;

      // Broadcast updated player position
      io.emit("playerUpdate", { id: socket.id, position: players[socket.id] });
    }
  });


  // Handle chat messages
  socket.on("chatMessage", (message) => {
    const playerName = players[socket.id]?.name || "Anonymous";
    const formattedMessage = `${playerName}: ${message}`;
    console.log("Chat:", formattedMessage);

    // Broadcast the message to all players
    io.emit("chatMessage", formattedMessage);
  });

  // Handle player disconnection
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];

    // Notify all players about the updated player list
    io.emit("playerList", players);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
