
const express = require("express");
const cors = require("cors");
const { customAlphabet } = require("nanoid");

const app = express();
const PORT = process.env.PORT || 4000;
const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

app.use(cors());
app.use(express.json());

const rooms = new Map();
const scores = [];

const clean = (v, max = 250) => String(v || "").trim().slice(0, max);
const cleanCode = (v) => String(v || "").trim().toUpperCase().slice(0, 10);

app.get("/", (req, res) => res.json({ status: "ok", service: "PlayPadi API" }));
app.get("/health", (req, res) => res.json({ status: "ok", rooms: rooms.size, scores: scores.length }));

app.post("/rooms", (req, res) => {
  const hostName = clean(req.body.hostName, 40);
  if (!hostName) return res.status(400).json({ message: "hostName required" });

  let code = makeCode();
  while (rooms.has(code)) code = makeCode();

  const room = {
    code,
    hostName,
    players: [{ name: hostName, score: 0 }],
    messages: [],
    createdAt: new Date().toISOString()
  };

  rooms.set(code, room);
  res.status(201).json(room);
});

app.get("/rooms/:code", (req, res) => {
  const room = rooms.get(cleanCode(req.params.code));
  if (!room) return res.status(404).json({ message: "Room not found" });
  res.json(room);
});

app.post("/rooms/:code/join", (req, res) => {
  const room = rooms.get(cleanCode(req.params.code));
  if (!room) return res.status(404).json({ message: "Room not found" });

  const name = clean(req.body.name, 40);
  if (!name) return res.status(400).json({ message: "name required" });

  if (!room.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    room.players.push({ name, score: 0 });
  }

  res.json(room);
});

app.get("/rooms/:code/messages", (req, res) => {
  const room = rooms.get(cleanCode(req.params.code));
  if (!room) return res.status(404).json({ message: "Room not found" });
  res.json(room.messages);
});

app.post("/rooms/:code/messages", (req, res) => {
  const room = rooms.get(cleanCode(req.params.code));
  if (!room) return res.status(404).json({ message: "Room not found" });

  const text = clean(req.body.text, 240);
  if (!text) return res.status(400).json({ message: "text required" });

  const message = { id: Date.now().toString(), text, createdAt: new Date().toISOString() };
  room.messages.unshift(message);
  res.status(201).json(message);
});

app.post("/scores", (req, res) => {
  const name = clean(req.body.name, 40);
  if (!name) return res.status(400).json({ message: "name required" });

  const entry = {
    id: Date.now().toString(),
    name,
    score: Number(req.body.score) || 0,
    roomCode: cleanCode(req.body.roomCode || "SOLO"),
    gameTitle: clean(req.body.gameTitle || "Game", 80),
    createdAt: new Date().toISOString()
  };

  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);

  const room = rooms.get(entry.roomCode);
  if (room) {
    const player = room.players.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (player) player.score = Math.max(player.score || 0, entry.score);
    else room.players.push({ name, score: entry.score });
    room.players.sort((a, b) => b.score - a.score);
  }

  res.status(201).json(scores.slice(0, 50));
});

app.get("/scores", (req, res) => res.json(scores.slice(0, 50)));

app.listen(PORT, () => console.log(`PlayPadi API running on ${PORT}`));
