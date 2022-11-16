const router = require('express').Router();
const pool = require('../database');
const path = require('path');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT id, username, profile_picture FROM users')

  return res.status(200).json({
    users: result.rows
  })
})

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT first_name, last_name, username, profile_picture, profile_caption FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length > 0) {
      return res.status(200).json({
        user: result.rows[0],
      });
    }
  } catch {
    return res.status(500).json({
      message: 'Unable to retrieve user data',
    });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id])
    return res.status(204).json({
      message: 'Account deleted successfully'
    });
  } catch {
    return res.status(500).json({
      message: 'Unable to delete user'
    });
  }
});

router.get('/profile-picture/:profilePicture', async (req, res) => {
  const { profilePicture } = req.params;
  res.sendFile(path.join(__dirname, '../uploads', profilePicture))
})

module.exports = router;
