
const express = require("express");
const cors = require("cors");
const { customAlphabet } = require("nanoid");

const app = express();
const PORT = process.env.PORT || 4000;
const generateRoomCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

app.use(cors());
app.use(express.json());

const rooms = new Map();
const scores = [];

function clean(v,max=40){ return String(v||"").trim().slice(0,max); }
function code(v){ return String(v||"").trim().toUpperCase().slice(0,10); }

app.get("/health",(req,res)=>res.json({status:"ok", service:"PlayPadi API"}));

app.post("/rooms",(req,res)=>{
  const hostName = clean(req.body.hostName);
  if(!hostName) return res.status(400).json({message:"hostName required"});
  const roomCode = generateRoomCode();
  const room = {code:roomCode, hostName, players:[{name:hostName,score:0}], createdAt:new Date().toISOString()};
  rooms.set(roomCode, room);
  res.status(201).json(room);
});

app.get("/rooms/:code",(req,res)=>{
  const room=rooms.get(code(req.params.code));
  if(!room) return res.status(404).json({message:"Room not found"});
  res.json(room);
});

app.post("/rooms/:code/join",(req,res)=>{
  const room=rooms.get(code(req.params.code));
  if(!room) return res.status(404).json({message:"Room not found"});
  const name=clean(req.body.name);
  if(!name) return res.status(400).json({message:"name required"});
  
  if(!room.players.find(p=>p.name.toLowerCase()===name.toLowerCase())) room.players.push({name,score:0});
  res.json(room);
});

app.post("/scores",(req,res)=>{
  const entry = {
    name: clean(req.body.name),
    score: Number(req.body.score)||0,
    roomCode: code(req.body.roomCode||"SOLO"),
    gameTitle: clean(req.body.gameTitle,60),
    createdAt: new Date().toISOString()
  };
  if(!entry.name) return res.status(400).json({message:"name required"});
  scores.push(entry);
  scores.sort((a,b)=>b.score-a.score);
  res.status(201).json(scores.slice(0,20));
});

app.get("/scores",(req,res)=>res.json(scores.slice(0,20)));

app.listen(PORT, ()=>console.log(`PlayPadi API running on ${PORT}`));
