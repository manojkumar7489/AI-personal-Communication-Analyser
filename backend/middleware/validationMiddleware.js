/**
 * Validates signup payload
 */
const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Full name is required.' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  }

  next();
};

/**
 * Validates login payload
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  next();
};

/**
 * Validates chat message text
 */
const validateChatMessage = (req, res, next) => {
  const { conversationId, text } = req.body;

  if (!conversationId) {
    return res.status(400).json({ success: false, message: 'conversationId is required.' });
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
  }

  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateChatMessage
};