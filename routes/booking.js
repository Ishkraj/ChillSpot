const express = require("express");
const router = express.Router({ mergeParams: true });

const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");
const {
  sendNewBookingEmailToHost,
  sendBookingConfirmedEmail,
  sendBookingRejectedEmail
} = require("../utils/sendEmail");


// ===============================
// CREATE BOOKING (RESERVE) ✅
// ===============================
router.post("/", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate("owner");

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    if (!listing.owner) {
      req.flash("error", "This stay is not available");
      return res.redirect(`/listings/${id}`);
    }

    const { checkIn, checkOut, guests } = req.body;

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const nights =
      (end - start) / (1000 * 60 * 60 * 24);

    if (nights <= 0) {
      req.flash("error", "Invalid dates");
      return res.redirect(`/listings/${id}`);
    }

    const totalPrice = nights * listing.price;

    const booking = new Booking({
      listing: id,
      user: req.user._id,
      checkIn,
      checkOut,
      guests,
      totalPrice,
    });

    await booking.save();

    // Email to host
    await sendNewBookingEmailToHost({
      hostEmail: listing.owner?.email,
      guestName: req.user.username,
      listingTitle: listing.title,
      checkIn,
      checkOut,
      guests,
      totalPrice
    });
    

    req.flash("success", "Booking request sent!");
    res.redirect("/bookings");

  } catch (err) {
    console.log("BOOKING ERROR:", err);
    req.flash("error", "Something went wrong");
    res.redirect("back");
  }
});

// ===============================
// GUEST: My Bookings
// ===============================
router.get("/", isLoggedIn, async (req, res) => {
  const bookings = await Booking.find({
    user: req.user._id,
  }).populate("listing");

  res.render("bookings/index", { bookings });
});

// ===============================
// HOST: Booking Requests
// ===============================
router.get("/host", isLoggedIn, async (req, res) => {
  const bookings = await Booking.find({})
    .populate("listing")
    .populate("user");

  const hostBookings = bookings.filter(
    (b) => b.listing.owner.equals(req.user._id)
  );

  res.render("bookings/host", {
    bookings: hostBookings,
  });
});

// ===============================
// HOST: Confirm Booking
// ===============================
router.post("/:bookingId/confirm", isLoggedIn, async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId)
    .populate("listing")
    .populate("user");

  if (!booking.listing.owner.equals(req.user._id)) {
    req.flash("error", "Not authorized");
    return res.redirect("back");
  }

  booking.status = "confirmed";
  booking.address = booking.listing.location;

  await booking.save();

  // Email to guest
  await sendBookingConfirmedEmail({
    guestEmail: booking.user.email,
    guestName: booking.user.username,
    listingTitle: booking.listing.title,
    address: booking.address,
    mapLink: booking.listing.mapLink,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    totalPrice: booking.totalPrice
  });
  

  req.flash("success", "Booking confirmed!");
  res.redirect("/bookings/host");
});

// ===============================
// HOST: Reject Booking
// ===============================
router.post("/:bookingId/reject", isLoggedIn, async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId)
    .populate("listing")
    .populate("user");

  if (!booking.listing.owner.equals(req.user._id)) {
    req.flash("error", "Not authorized");
    return res.redirect("back");
  }

  booking.status = "rejected";
  await booking.save();

  await sendBookingRejectedEmail({
    guestEmail: booking.user.email,
    guestName: booking.user.username,
    listingTitle: booking.listing.title
  });
  

  req.flash("error", "Booking rejected");
  res.redirect("/bookings/host");
});

module.exports = router;
