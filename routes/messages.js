const router = require('express').Router();
const pool = require('../database');

router.post('/', async (req, res) => {
  const { message, senderId, recievingId } = req.body;

  const result = await pool.query(
    'INSERT INTO messages (sender_user_id, receiving_user_id, message) VALUES ($1, $2, $3) RETURNING *',
    [senderId, recievingId, message]
  );


});

router.post('/from-users', async (req, res) => {
  const { currentUser, otherUser } = req.body;

  const result = await pool.query(
    'SELECT * FROM messages WHERE sender_user_id = $1 OR sender_user_id = $2 OR receiving_user_id = $3 OR receiving_user_id = $4',
    [currentUser, otherUser, currentUser, otherUser]
  );


  return res.status(200).json({
    messages: result.rows
  })
});

module.exports = router;
