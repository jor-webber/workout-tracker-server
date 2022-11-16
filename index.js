const express = require('express');
const http = require('http');
const app = express();
const cors = require('cors');
const { truncate } = require('fs/promises');
const pool = require('./database');


const port = process.env.PORT || 3001;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: truncate }));
app.use(cors());
app.use(express.static('public'))
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/admin', require('./routes/admin'));
app.use('/exercises', require('./routes/exercises'));
app.use('/muscle-groups', require('./routes/muscleGroups'));
app.use('/workouts', require('./routes/workouts'));
app.use('/statistics', require('./routes/userStats'));
app.use('/forum', require('./routes/forum'));
app.use('/messages', require('./routes/messages'));

const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
});

let clientSocketIds = [];

const getSocketByUserId = (userId) => {
  let userSocket = null;
  for (let socket in clientSocketIds) {
    if (socket.userId === userId) {
      userSocket = socket;
      break;
    }
  }
  return userSocket;
};

io.on('connection', async (socket) => {
  // fetch existing users
  socket.on('sendMessage', async (data) => {
    const { message, senderId, recievingId } = data;

    const result = await pool.query(
      'INSERT INTO messages (sender_user_id, receiving_user_id, message) VALUES ($1, $2, $3) RETURNING *',
      [senderId, recievingId, message]
    );

    // basic emit
    socket.emit('messageSent', result.rows[0]);

    // to all clients in the current namespace except the sender
    socket.broadcast.emit('messageSent', result.rows[0]);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
