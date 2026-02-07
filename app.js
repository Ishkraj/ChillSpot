if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
require("module-alias/register");


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Booking = require("./models/booking");




// routes

const listingRouter = require("./routes/listing.js");
const bookingRouter = require("./routes/booking");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");




// ======================
// DATABASE
// ======================

const dbUrl = process.env.ATLASDB_URL;

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.log("❌ Mongo error:", err);
  });

// ======================
// VIEW ENGINE
// ======================

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ======================
// MIDDLEWARE
// ======================

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));



// ======================
// SESSION STORE
// ======================

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", function (e) {
  console.log("❌ SESSION STORE ERROR", e);
});

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// ======================
// PASSPORT CONFIG
// ======================

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ======================
// GLOBAL VARIABLES
// ======================

app.use(async (req, res, next) => {

  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;

  // 🔔 Notification dot for host
  res.locals.hasPendingBooking = false;

  if (req.user) {

    try {

      const bookings = await Booking.find({
        status: "pending"
      }).populate("listing");

      const myPending = bookings.filter(
        (b) => b.listing.owner.equals(req.user._id)
      );

      if (myPending.length > 0) {
        res.locals.hasPendingBooking = true;
      }

    } catch (err) {
      console.log("Notification Error:", err);
    }

  }

  next();
});

// ======================
// ROUTES
// ======================



app.use("/listings", listingRouter);
app.use("/bookings", bookingRouter);                 // guest routes
app.use("/listings/:id/bookings", bookingRouter);   // listing/host routes

app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.get("/", (req, res) => {
  res.redirect("/listings");
});

// ======================
// ERROR HANDLING
// ======================

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// ======================
// SERVER
// ======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
