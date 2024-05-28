const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const db = new sqlite3.Database('./database.sqlite');

app.use(express.static('public'));

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS rooms (id TEXT)");
});

app.get('/create-room', (req, res) => {
  const roomId = uuidv4();
  db.run("INSERT INTO rooms (id) VALUES (?)", [roomId], (err) => {
    if (err) {
      return res.status(500).send("Error creating room");
    }
    res.send({ roomId });
  });
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
