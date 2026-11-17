const jwt = require('jsonwebtoken');

// The middleware hands control to next() only if the server-signed token
// is valid; routes that use it thus receive a verified req.userId.
module.exports = function requireAuth(req, res, next) {
  // The Bearer scheme is the HTTP convention for sending the access token.
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    // verify checks the signature with JWT_SECRET and automatically checks expiry (exp).
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
