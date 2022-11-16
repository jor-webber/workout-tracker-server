const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    const jwtToken = req.header('token');

    if (!jwtToken) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const payload = jwt.verify(jwtToken, process.env.jwtSecret);

    req.user = payload.user;

    next();
    
  } catch (err) {
    res.status(500).json({
      error: 'Unauthorized.'
    });
  }
}