const Booking = require("../models/booking");
const Listing = require("@models/listing");
const User = require("@models/user");

const {
  sendNewBookingEmailToHost,
  sendBookingConfirmedEmail,
  sendBookingRejectedEmail
} = require("../utils/sendEmail");

// ===============================
// CREATE BOOKING (FIXED WITH HYBRID PRICING)
// ===============================
module.exports.createBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Listing Fetch karo aur Owner Populate karo
    const listing = await Listing.findById(id).populate("owner");
    console.log("========== OWNER DEBUG ==========");
    console.log("listing.owner =>", listing.owner);
    console.log("owner.email =>", listing.owner?.email);
    console.log("================================");

    if (!listing || !listing.owner) {
      req.flash("error", "Invalid listing or owner not found");
      return res.redirect("/listings");
    }

    const { checkIn, checkOut, guests } = req.body;
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    // Date Validation
    if (end <= start) {
      req.flash("error", "Invalid dates");
      return res.redirect("back");
    }

   // ==========================================
    // 🔥 BACKEND HYBRID PRICING LOGIC (FIXED)
    // ==========================================
    // Math.ceil ki jagah Math.round use kiya hai exact days ke liye
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
    console.log("==== PRICE DEBUG ====");
    console.log("Days Calculated:", days);
    console.log("Pricing Type in DB:", listing.pricingType);
    console.log("Monthly Price in DB:", listing.monthlyPrice);
    console.log("Daily Price in DB:", listing.price);
    console.log("=====================");
    let totalPrice = 0;
    
    
    const pricingType = listing.pricingType || "Daily";
    const dailyPrice = Number(listing.price) || 0;
    const monthlyPrice = Number(listing.monthlyPrice) || 0;

    if (pricingType === 'Monthly') {
      let months = Math.ceil(days / 30);
      totalPrice = months * monthlyPrice;
    } 
    else if (pricingType === 'Both') {
      if (days >= 30) {
        let months = Math.floor(days / 30);
        let extraDays = days % 30;
        totalPrice = (months * monthlyPrice) + (extraDays * dailyPrice);
      } else {
        totalPrice = days * dailyPrice;
      }
    } 
    else {
      totalPrice = days * dailyPrice;
    }
    
   
    // ==========================================

    // 2. Booking Create karo
    const booking = new Booking({
      listing: listing._id,
      user: req.user._id,
      checkIn,
      checkOut,
      guests,
      totalPrice, // Yahan ab smart calculated price aayega
      status: "pending"
    });

    await booking.save();

    // ==========================================
    // ✅ FETCH HOST EMAIL (FIXED LOGIC)
    // ==========================================
    let hostEmail = listing.owner.email;

    if (!hostEmail) {
      console.log("⚠️ Listing owner populated but no email directly found. Fetching manually...");
      const ownerUser = await User.findById(listing.owner._id || listing.owner);
      hostEmail = ownerUser ? ownerUser.email : null;
    }

    console.log("📧 FINAL HOST EMAIL =>", hostEmail);

    if (!hostEmail) {
      console.log("❌ ERROR: Host email not found in DB");
      req.flash("error", "Booking saved, but Host email not found for notification.");
      return res.redirect(`/listings/${id}`);
    }

    // Email Bhejo
    await sendNewBookingEmailToHost({
      hostEmail,
      guestName: req.user.username,
      listingTitle: listing.title,
      checkIn,
      checkOut,
      guests,
      totalPrice // Host ko email mein bhi exact sahi price dikhega
    });

    req.flash("success", "Request sent to host!");
    res.redirect(`/listings/${id}`);

  } catch (err) {
    console.log("❌ CREATE BOOKING ERROR:", err);
    req.flash("error", "Something went wrong");
    res.redirect("back");
  }
};

// ===============================
// HOST DASHBOARD – VIEW BOOKINGS
// ===============================
module.exports.hostBookings = async (req, res) => {
  const { id } = req.params;

  const bookings = await Booking.find({ listing: id })
    .populate("user")
    .populate("listing");

  res.render("bookings/host.ejs", { bookings });
};

// ===============================
// CONFIRM BOOKING
// ===============================
module.exports.confirmBooking = async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId)
    .populate("user")
    .populate("listing");

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("back");
  }

  booking.status = "confirmed";
  booking.address = booking.listing.location;

  await booking.save();

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
  res.redirect("back");
};

// ===============================
// REJECT BOOKING
// ===============================
module.exports.rejectBooking = async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId)
    .populate("user")
    .populate("listing");

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("back");
  }

  booking.status = "rejected";
  await booking.save();

  await sendBookingRejectedEmail({
    guestEmail: booking.user.email,
    guestName: booking.user.username,
    listingTitle: booking.listing.title
  });

  req.flash("success", "Booking rejected!");
  res.redirect("back");
};