const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('Authorization');
  
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    // Token usually comes as "Bearer <token>", so we split it
    const actualToken = token.split(' ')[1]; 
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded; // Adds user info to the request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};