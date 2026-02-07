const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");

const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const userController = require("../controllers/user.js");


// ======================
// SIGNUP
// ======================
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));


// ======================
// OTP VERIFY (NEW)
// ======================
router
  .route("/verify-otp")
  .get(userController.renderOTP)
  .post(wrapAsync(userController.verifyOTP));


// ======================
// LOGIN
// ======================
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.Login
  );


// ======================
// LOGOUT
// ======================
router.get("/logout", userController.Logout);


// ======================
// PROFILE
// ======================
router.get("/profile", isLoggedIn, (req, res) => {
  res.render("users/profile", {
    user: req.user,
  });
});


module.exports = router;
