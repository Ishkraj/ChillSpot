const User = require("../models/user");
const { sendOTP } = require("../utils/sendEmail");


// ===============================
// SIGNUP FORM
// ===============================
module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};


// ===============================
// SIGNUP + OTP
// ===============================
module.exports.signup = async (req, res) => {
  try {

    const { username, password, email } = req.body;

    // check existing email
    const existing = await User.findOne({ email });

    if (existing) {
      req.flash("error", "Email already registered");
      return res.redirect("/signup");
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 👉 SEND OTP FIRST (FIX)
    await sendOTP(email, otp);

    // create user (not verified yet)
    const newUser = new User({
      username,
      email,
      isVerified: false,
      otp,
      otpExpires: Date.now() + 5 * 60 * 1000 // 5 min
    });

    const registeredUser = await User.register(newUser, password);

    // save temp user id
    req.session.tempUser = registeredUser._id;

    req.flash("success", "OTP sent to your email");

    res.redirect("/verify-otp");

  } catch (e) {

    console.log("Signup Error:", e);

    req.flash("error", "OTP sending failed. Try again.");
    res.redirect("/signup");
  }
};


// ===============================
// OTP PAGE
// ===============================
module.exports.renderOTP = (req, res) => {
  res.render("users/verifyOtp.ejs");
};


// ===============================
// VERIFY OTP
// ===============================
module.exports.verifyOTP = async (req, res) => {

  try {

    const { otp } = req.body;

    const user = await User.findById(req.session.tempUser);

    if (!user) {
      req.flash("error", "Session expired");
      return res.redirect("/signup");
    }

    if (
      user.otp !== otp ||
      user.otpExpires < Date.now()
    ) {
      req.flash("error", "Invalid or expired OTP");
      return res.redirect("/verify-otp");
    }

    // verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    req.session.tempUser = null;

    req.flash("success", "Account verified! Login now");

    res.redirect("/login");

  } catch (err) {

    console.log("OTP Error:", err);

    req.flash("error", "OTP verification failed");
    res.redirect("/signup");
  }
};


// ===============================
// LOGIN FORM
// ===============================
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};


// ===============================
// LOGIN (AFTER PASSPORT)
// ===============================
module.exports.Login = async (req, res) => {

  // block unverified users
  if (!req.user.isVerified) {

    req.logout(() => {});

    req.flash("error", "Please verify OTP first");
    return res.redirect("/login");
  }

  req.flash("success", "Welcome back to ChillSpot!");

  let redirectUrl = res.locals.redirectUrl || "/listings";

  res.redirect(redirectUrl);
};


// ===============================
// LOGOUT
// ===============================
module.exports.Logout = (req, res) => {

  req.logout((err) => {

    if (err) {
      return next(err);
    }

    req.flash("success", "You are logged out!");

    res.redirect("/listings");
  });
};

