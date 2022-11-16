const router = require('express').Router();
const pool = require('../database');
const User = require('../models/User');

router.get('/get-users', async (req, res) => {
  const users = await pool.query('SELECT * FROM users');

  const usersList = [];
  users.rows.forEach((user) => {
    const userDTO = new User(
      user.username,
      user.first_name,
      user.last_name,
      user.email,
      user.gender,
      user.profilePicture,
      user.profileCaption
    );
    usersList.push(userDTO);
  });

  return res.json({
    status: 'Success',
    users: usersList,
  });
});

router.get('/get-user/:id', async(req, res) => {
  const id = req.params.id;
  const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [id])

  const user = userQuery.rows[0]
  
  const userDTO = new User(
    user.username,
    user.first_name,
    user.last_name,
    user.email,
    user.gender,
    user.profilePicture,
    user.profileCaption
  );

  return res.json({
    status: 'Success',
    user: userDTO
  })

})

module.exports = router;
