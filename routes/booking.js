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

    const listing =
      await Listing.findById(id).populate("owner");


    if (!listing) {

      req.flash(
        "error",
        "Listing not found"
      );

      return res.redirect("/listings");
    }


    if (!listing.owner) {

      req.flash(
        "error",
        "This stay is not available"
      );

      return res.redirect(
        `/listings/${id}`
      );
    }


    const {
      checkIn,
      checkOut,
      guests
    } = req.body;


    const start =
      new Date(checkIn);

    const end =
      new Date(checkOut);


    // ==========================================
    // 🔐 VALIDATE DATES
    // ==========================================

    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime()) ||
      end <= start
    ) {

      req.flash(
        "error",
        "Invalid booking dates"
      );

      return res.redirect(
        `/listings/${id}`
      );
    }


    const days = Math.round(
      (end - start) /
      (1000 * 60 * 60 * 24)
    );


    if (days <= 0) {

      req.flash(
        "error",
        "Invalid dates"
      );

      return res.redirect(
        `/listings/${id}`
      );
    }


    // ==========================================
    // 🔒 DATE CONFLICT CHECK
    // ==========================================
    // Existing pending OR confirmed booking
    // cannot overlap with this booking.
    //
    // Existing checkIn < New checkOut
    // AND
    // Existing checkOut > New checkIn
    // ==========================================

    const conflictingBooking =
      await Booking.findOne({

        listing: id,

        status: {
          $in: [
            "pending",
            "confirmed"
          ]
        },

        checkIn: {
          $lt: end
        },

        checkOut: {
          $gt: start
        }

      });


    if (conflictingBooking) {

      req.flash(
        "error",
        "These dates are already booked or reserved. Please choose different dates."
      );

      return res.redirect(
        `/listings/${id}`
      );
    }


    // ==========================================
    // 🔥 HYBRID PRICING LOGIC
    // ==========================================

    let totalPrice = 0;

    const pricingType =
      listing.pricingType || "Daily";

    const dailyPrice =
      Number(listing.price) || 0;

    const monthlyPrice =
      Number(listing.monthlyPrice) || 0;


    if (pricingType === "Monthly") {

      let months =
        Math.ceil(days / 30);

      totalPrice =
        months * monthlyPrice;

    }

    else if (pricingType === "Both") {

      if (days >= 30) {

        let months =
          Math.floor(days / 30);

        let extraDays =
          days % 30;

        totalPrice =
          (months * monthlyPrice) +
          (extraDays * dailyPrice);

      }

      else {

        totalPrice =
          days * dailyPrice;

      }

    }

    else {

      totalPrice =
        days * dailyPrice;

    }


    // ==========================================
    // ⚡ INSTANT BOOK SMART LOGIC
    // ==========================================

    const isInstant =
      listing.isInstantBook;


    const booking =
      new Booking({

        listing: id,

        user:
          req.user._id,

        checkIn,

        checkOut,

        guests,

        totalPrice,

        status:
          isInstant
            ? "confirmed"
            : "pending",

        address:
          isInstant
            ? listing.location
            : undefined

      });


    await booking.save();


    const inDate =
      checkIn
        ? new Date(checkIn).toDateString()
        : "N/A";


    const outDate =
      checkOut
        ? new Date(checkOut).toDateString()
        : "N/A";


    if (isInstant) {

      // 🚀 Direct Guest Confirmation Email

      await sendBookingConfirmedEmail({

        guestEmail:
          req.user.email,

        guestName:
          req.user.username,

        listingTitle:
          listing.title,

        address:
          listing.location,

        mapLink:
          listing.mapLink,

        checkIn:
          inDate,

        checkOut:
          outDate,

        guests,

        totalPrice

      });


      req.flash(
        "success",
        "⚡ Instant Booking Confirmed!"
      );

    }

    else {

      // ⏳ Host Approval Email

      await sendNewBookingEmailToHost({

        hostEmail:
          listing.owner?.email,

        guestName:
          req.user.username,

        listingTitle:
          listing.title,

        checkIn:
          inDate,

        checkOut:
          outDate,

        guests,

        totalPrice

      });


      req.flash(
        "success",
        "Booking request sent!"
      );

    }


    res.redirect(
      "/bookings"
    );


  } catch (err) {

    console.log(
      "BOOKING ERROR:",
      err
    );

    req.flash(
      "error",
      "Something went wrong"
    );

    res.redirect("back");
  }
});


// ===============================
// GUEST: My Bookings
// ===============================
router.get(
  "/",
  isLoggedIn,
  async (req, res) => {

    const bookings =
      await Booking.find({

        user:
          req.user._id

      })
        .populate("listing")
        .sort({
          createdAt: -1
        });


    res.render(
      "bookings/index",
      {
        bookings
      }
    );
  }
);


// ===============================
// HOST: Booking Requests
// ===============================
router.get(
  "/host",
  isLoggedIn,
  async (req, res) => {

    const bookings =
      await Booking.find({})
        .populate("listing")
        .populate("user")
        .sort({
          createdAt: -1
        });


    const hostBookings =
      bookings.filter(
        (b) =>
          b.listing &&
          b.listing.owner.equals(
            req.user._id
          )
      );


    res.render(
      "bookings/host",
      {
        bookings:
          hostBookings
      }
    );
  }
);


// ===============================
// HOST: Confirm Booking
// ===============================
router.post(
  "/:bookingId/confirm",
  isLoggedIn,
  async (req, res) => {

    try {

      const {
        bookingId
      } = req.params;


      const booking =
        await Booking.findById(
          bookingId
        )
          .populate("listing")
          .populate("user");


      if (!booking) {

        req.flash(
          "error",
          "Booking not found"
        );

        return res.redirect(
          "/bookings/host"
        );
      }


      if (
        !booking.listing ||
        !booking.listing.owner.equals(
          req.user._id
        )
      ) {

        req.flash(
          "error",
          "Not authorized"
        );

        return res.redirect(
          "back"
        );
      }


      // ==========================================
      // 🔒 RE-CHECK DATE CONFLICT
      // ==========================================
      // This protects against another booking
      // being created after this request.
      // ==========================================

      const conflictingBooking =
        await Booking.findOne({

          _id: {
            $ne: booking._id
          },

          listing:
            booking.listing._id,

          status: {
            $in: [
              "pending",
              "confirmed"
            ]
          },

          checkIn: {
            $lt: booking.checkOut
          },

          checkOut: {
            $gt: booking.checkIn
          }

        });


      if (conflictingBooking) {

        req.flash(
          "error",
          "These dates are no longer available because another booking already exists."
        );

        return res.redirect(
          "/bookings/host"
        );
      }


      booking.status =
        "confirmed";


      booking.address =
        booking.listing.location;


      await booking.save();


      // ==========================================
      // 📧 CONFIRMATION EMAIL
      // ==========================================

      await sendBookingConfirmedEmail({

        guestEmail:
          booking.user.email,

        guestName:
          booking.user.username,

        listingTitle:
          booking.listing.title,

        address:
          booking.address,

        mapLink:
          booking.listing.mapLink,

        checkIn:
          booking.checkIn,

        checkOut:
          booking.checkOut,

        guests:
          booking.guests,

        totalPrice:
          booking.totalPrice

      });


      req.flash(
        "success",
        "Booking confirmed!"
      );


      res.redirect(
        "/bookings/host"
      );


    } catch (err) {

      console.log(
        "CONFIRM BOOKING ERROR:",
        err
      );

      req.flash(
        "error",
        "Something went wrong"
      );

      res.redirect(
        "/bookings/host"
      );
    }
  }
);


// ===============================
// HOST: Reject Booking
// ===============================
router.post(
  "/:bookingId/reject",
  isLoggedIn,
  async (req, res) => {

    const {
      bookingId
    } = req.params;


    const booking =
      await Booking.findById(
        bookingId
      )
        .populate("listing")
        .populate("user");


    if (
      !booking ||
      !booking.listing ||
      !booking.listing.owner.equals(
        req.user._id
      )
    ) {

      req.flash(
        "error",
        "Not authorized"
      );

      return res.redirect(
        "back"
      );
    }


    booking.status =
      "rejected";


    await booking.save();


    await sendBookingRejectedEmail({

      guestEmail:
        booking.user.email,

      guestName:
        booking.user.username,

      listingTitle:
        booking.listing.title

    });


    req.flash(
      "error",
      "Booking rejected"
    );


    res.redirect(
      "/bookings/host"
    );
  }
);


// ===============================
// GUEST: HOST BEHAVIOUR FEEDBACK
// ===============================
router.post(
  "/:bookingId/host-feedback",
  isLoggedIn,
  async (req, res) => {

    try {

      const {
        bookingId
      } = req.params;


      const {
        rating,
        comment
      } = req.body;


      const booking =
        await Booking.findById(
          bookingId
        );


      if (!booking) {

        req.flash(
          "error",
          "Booking not found"
        );

        return res.redirect(
          "/bookings"
        );
      }


      // Only actual guest
      if (
        !booking.user.equals(
          req.user._id
        )
      ) {

        req.flash(
          "error",
          "Not authorized"
        );

        return res.redirect(
          "/bookings"
        );
      }


      // Only confirmed bookings
      if (
        booking.status !==
        "confirmed"
      ) {

        req.flash(
          "error",
          "Feedback is available only for confirmed bookings"
        );

        return res.redirect(
          "/bookings"
        );
      }


      // Check-in date reached
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );


      const checkInDate =
        new Date(
          booking.checkIn
        );

      checkInDate.setHours(
        0,
        0,
        0,
        0
      );


      if (
        today <
        checkInDate
      ) {

        req.flash(
          "error",
          "Host feedback is available from check-in date"
        );

        return res.redirect(
          "/bookings"
        );
      }


      // Prevent duplicate feedback
      if (
        booking
          .hostBehaviorFeedback
          ?.submittedAt
      ) {

        req.flash(
          "error",
          "Host feedback already submitted"
        );

        return res.redirect(
          "/bookings"
        );
      }


      // ==========================================
      // 🔐 VALIDATE RATING
      // ==========================================

      const numericRating =
        Number(rating);


      if (
        !Number.isInteger(
          numericRating
        ) ||
        numericRating < 1 ||
        numericRating > 5
      ) {

        req.flash(
          "error",
          "Please provide a valid rating between 1 and 5"
        );

        return res.redirect(
          "/bookings"
        );
      }


      booking.hostBehaviorFeedback = {

        rating:
          numericRating,

        comment,

        submittedAt:
          new Date()

      };


      await booking.save();


      req.flash(
        "success",
        "Host feedback submitted successfully!"
      );


      res.redirect(
        "/bookings"
      );


    } catch (err) {

      console.log(
        "HOST FEEDBACK ERROR:",
        err
      );

      req.flash(
        "error",
        "Something went wrong"
      );

      res.redirect(
        "/bookings"
      );
    }
  }
);


// ===============================
// GUEST: PROPERTY ACCURACY FEEDBACK
// ===============================
router.post(
  "/:bookingId/property-feedback",
  isLoggedIn,
  async (req, res) => {

    try {

      const {
        bookingId
      } = req.params;


      const {
        rating,
        comment
      } = req.body;


      const booking =
        await Booking.findById(
          bookingId
        );


      if (!booking) {

        req.flash(
          "error",
          "Booking not found"
        );

        return res.redirect(
          "/bookings"
        );
      }


      // Only actual guest
      if (
        !booking.user.equals(
          req.user._id
        )
      ) {

        req.flash(
          "error",
          "Not authorized"
        );

        return res.redirect(
          "/bookings"
        );
      }


      // Only confirmed bookings
      if (
        booking.status !==
        "confirmed"
      ) {

        req.flash(
          "error",
          "Feedback is available only for confirmed bookings"
        );

        return res.redirect(
          "/bookings"
        );
      }


      // Check-out date reached
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );


      const checkOutDate =
        new Date(
          booking.checkOut
        );

      checkOutDate.setHours(
        0,
        0,
        0,
        0
      );


      if (
        today <
        checkOutDate
      ) {

        req.flash(
          "error",
          "Property feedback is available from check-out date"
        );

        return res.redirect(
          "/bookings"
        );
      }


      // Prevent duplicate feedback
      if (
        booking
          .propertyAccuracyFeedback
          ?.submittedAt
      ) {

        req.flash(
          "error",
          "Property feedback already submitted"
        );

        return res.redirect(
          "/bookings"
        );
      }


      // ==========================================
      // 🔐 VALIDATE RATING
      // ==========================================

      const numericRating =
        Number(rating);


      if (
        !Number.isInteger(
          numericRating
        ) ||
        numericRating < 1 ||
        numericRating > 5
      ) {

        req.flash(
          "error",
          "Please provide a valid rating between 1 and 5"
        );

        return res.redirect(
          "/bookings"
        );
      }


      booking.propertyAccuracyFeedback = {

        rating:
          numericRating,

        comment,

        submittedAt:
          new Date()

      };


      await booking.save();


      req.flash(
        "success",
        "Property feedback submitted successfully!"
      );


      res.redirect(
        "/bookings"
      );


    } catch (err) {

      console.log(
        "PROPERTY FEEDBACK ERROR:",
        err
      );

      req.flash(
        "error",
        "Something went wrong"
      );

      res.redirect(
        "/bookings"
      );
    }
  }
);



module.exports = router;