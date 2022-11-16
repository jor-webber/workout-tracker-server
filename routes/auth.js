const router = require('express').Router();
const pool = require('../database');
const bcrypt = require('bcrypt');
const validInfo = require('../middleware/validInfo');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path')

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/')
  },
  filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage})


require('dotenv').config();

const jwtGenerator = require('../utils/jwtGenerator');
const sendEmail = require('../utils/sendEmail');

// Register

router.post('/register', validInfo, async (req, res) => {
  try {
    // Extract data from request
    const { username, firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const user = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    // If user exists, return error
    if (user.rows.length > 0) {
      return res.status(401).json({
        status: 'error',
        message: 'User already exists',
      });
    }

    // Get member role
    const roleQuery = await pool.query(
      "SELECT id from roles WHERE name = 'Member'"
    );
    const roleId = roleQuery.rows[0].id;

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // If user does not exist, create user
    const newUser = await pool.query(
      'INSERT INTO users (username, first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, firstName, lastName, email, hashPassword, roleId]
    );

    // Generate JWT
    const token = jwtGenerator(newUser.rows[0].id);

    // Return user
    return res.json({
      status: 'success',
      message: 'User created',
      data: {
        id: newUser.rows[0].id,
        token: token,
        username: newUser.rows[0].username,
        firstName: newUser.rows[0].first_name,
        lastName: newUser.rows[0].last_name,
        email: newUser.rows[0].email,
        profileCaption: newUser.rows[0].profile_caption,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: 'Server error',
    });
  }
});

// Login route
router.post('/login', validInfo, async (req, res) => {
  try {
    // Extract data from request
    const { email, password } = req.body;

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    // If user does not exist, return error
    if (user.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Password or Email is incorrect',
      });
    }
    console.log(user.rows)

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.rows[0].password);

    // If password is incorrect, return error
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect password',
      });
    }

    // Generate JWT
    const token = jwtGenerator(user.rows[0].id);

    const roleQuery = await pool.query('SELECT name FROM roles WHERE id = $1', [
      user.rows[0].role,
    ]);

    const role = roleQuery.rows[0].name;

    // If password is correct, return user
    return res.json({
      status: 'success',
      message: 'User logged in',
      data: {
        id: user.rows[0].id,
        token: token,
        username: user.rows[0].username,
        firstName: user.rows[0].first_name,
        lastName: user.rows[0].last_name,
        email: user.rows[0].email,
        profileCaption: user.rows[0].profile_caption,
        profilePicture: user.rows[0].profile_picture,
        role,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);

  if (userQuery.rows.length === 0) {
    return res.json({
      message: 'Email does not exist',
    });
  }

  const user = userQuery.rows[0];

  const jwtToken = jwtGenerator(user.id);

  const link =
    process.env.CLIENT_URL +
    `/reset-password?userId=${user.id}&token=${jwtToken}`;

  const message = `Please click the link below to change your password\n\n${link}`;

  sendEmail(email, 'Reset Password', message);

  res.status(203).json({
    status: 'Success',
    message: 'Email sent successfully',
  });
});

router.post('/reset-password', async (req, res) => {
  const { newPassword, confirmNewPassword, userId, token } = req.body;

  try {
    // check token validity before changing password
    const result = jwt.verify(token, process.env.jwtSecret);

    if (result.user !== userId) {
      return res.status(403).json({
        message: 'Cannot reset password',
      });
    }

    // check new password matches confirmation password
    if (newPassword !== confirmNewPassword) {
      return res.status(404).json({
        message: 'Passwords do not match',
      });
    }

    // hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    // update database
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [
      hashPassword,
      userId,
    ]);

    return res.status(200).json({
      message: 'Successfully updated password',
    });
  } catch {
    return res.status(500).json({
      message: 'Token expired',
    });
  }
});

router.post('/verify-token', async (req, res) => {
  const { token, userId } = req.body;

  try {
    const result = jwt.verify(token, process.env.jwtSecret);

    if (result.user === userId) {
      return res.status(200).json({
        message: 'Token verified successfully',
      });
    } else {
      return res.status(403).json({
        message: 'Invalid token',
      });
    }
  } catch {
    return res.status(403).json({
      message: 'Invalid token',
    });
  }
});

router.post('/upload-photo/:id',  upload.single('profilePicture'), async (req, res) => {
  const { id } = req.params;
  const filename = req.file.filename;

  const result = await pool.query(
    'UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING profile_picture',
    [filename, id]
  )

  console.log(result.rows);

  res.status(200).json({
    message: 'File uploaded',
    profilePicture: result.rows[0].profile_picture
  })
})

router.post('/update-user', upload.single('profilePicture'), async (req, res) => {
  const {
    id,
    username,
    firstName,
    lastName,
    email,
    profileCaption,
  } = req.body;

  console.log(req.body);

  console.log(req.body);

  const result = await pool.query(
    'UPDATE users SET first_name = $1, last_name = $2, email = $3, profile_caption = $4, username = $5 WHERE id = $6 RETURNING *',
    [firstName, lastName, email, profileCaption, username, id]
  );

  res.status(200).json({
    message: 'Profile updated successfully'
  })
});

module.exports = router;
