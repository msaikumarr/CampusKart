const express = require("express");
const router = express.Router(); // ✅ You forgot this
const passport = require("../config/passport");
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');
const { signup, login, logout, verify } = require("../controllers/AuthController");
const { JWT_SECRET, CLIENT_URL, isProduction } = require('../config/env');

// Define routes
router.post("/signup", upload.single('idDocument'), signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify", verify); // Optional - to verify token for protected routes

// Google OAuth routes
const googleAuthUnavailable = (req, res) => {
  res.status(503).json({ message: 'Google sign-in is not configured on this server' });
};

router.get("/google",
  passport.googleAuthEnabled
    ? passport.authenticate("google", { scope: ["profile", "email"] })
    : googleAuthUnavailable
);

router.get("/google/callback",
  passport.googleAuthEnabled
    ? passport.authenticate("google", { failureRedirect: `${CLIENT_URL}/login` })
    : googleAuthUnavailable,
  (req, res) => {
    // Create JWT token for the authenticated user
    const token = jwt.sign(
      { id: req.user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token as cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect to home page
    res.redirect(CLIENT_URL);
  }
);

module.exports = router; // ✅ Don't forget to export
