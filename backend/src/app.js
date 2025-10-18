const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

// store last location
let latestLocations = {};

// API endpoint (POST location from app)
app.post("/location", (req, res) => {
  const { userId, role, latitude, longitude } = req.body;

  latestLocations[userId] = { role, latitude, longitude, timestamp: Date.now() };

  // broadcast to all clients
  io.emit("locationUpdate", { userId, role, latitude, longitude });

  res.json({ status: "Location received" });
});

// Serve test web page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.emit("init", latestLocations);
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
