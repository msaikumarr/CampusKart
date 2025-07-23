const express = require("express");
const router = express.Router(); // ✅ You forgot this
const { signup, login, logout, verify } = require("../controllers/AuthController");

// Define routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify", verify); // Optional - to verify token for protected routes

module.exports = router; // ✅ Don't forget to export
