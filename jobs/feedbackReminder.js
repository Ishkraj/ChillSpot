const cron = require("node-cron");

const Booking = require("../models/booking");

const {
  sendHostBehaviorFeedbackEmail,
  sendPropertyAccuracyFeedbackEmail
} = require("../utils/sendEmail");


// ===============================
// CHECK-IN / CHECK-OUT FEEDBACK
// ===============================
async function sendFeedbackReminders() {
  try {

    console.log("🧪 Feedback reminder test started...");

    const now = new Date();

    console.log(
      "Current server date:",
      now.toString()
    );

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);


    // ==========================================
    // CHECK-IN TODAY
    // ==========================================

    const checkInBookings = await Booking.find({
      status: "confirmed",

      checkIn: {
        $gte: startOfToday,
        $lte: endOfToday
      },

      // false OR field missing
      hostBehaviorEmailSent: {
        $ne: true
      }

    })
      .populate("listing")
      .populate("user");


    console.log(
      "📥 Check-in bookings found:",
      checkInBookings.length
    );


    for (const booking of checkInBookings) {

      if (!booking.user?.email || !booking.listing) {

        console.log(
          `⚠️ Missing user email or listing for booking ${booking._id}`
        );

        continue;
      }


      console.log(
        `📧 Sending host behaviour email for booking ${booking._id}...`
      );


      const emailSent =
        await sendHostBehaviorFeedbackEmail({

          guestEmail:
            booking.user.email,

          guestName:
            booking.user.username,

          listingTitle:
            booking.listing.title

        });


      // Only mark as sent if email was successful
      if (emailSent) {

        booking.hostBehaviorEmailSent = true;

        await booking.save();


        console.log(
          `✅ Host feedback email processed for booking ${booking._id}`
        );

      } else {

        console.log(
          `❌ Host feedback email failed for booking ${booking._id}`
        );

      }
    }


    // ==========================================
    // CHECK-OUT TODAY
    // ==========================================

    const checkOutBookings = await Booking.find({
      status: "confirmed",

      checkOut: {
        $gte: startOfToday,
        $lte: endOfToday
      },

      // false OR field missing
      propertyAccuracyEmailSent: {
        $ne: true
      }

    })
      .populate("listing")
      .populate("user");


    console.log(
      "📤 Check-out bookings found:",
      checkOutBookings.length
    );


    for (const booking of checkOutBookings) {

      if (!booking.user?.email || !booking.listing) {

        console.log(
          `⚠️ Missing user email or listing for booking ${booking._id}`
        );

        continue;
      }


      console.log(
        `📧 Sending property accuracy email for booking ${booking._id}...`
      );


      const emailSent =
        await sendPropertyAccuracyFeedbackEmail({

          guestEmail:
            booking.user.email,

          guestName:
            booking.user.username,

          listingTitle:
            booking.listing.title

        });


      // Only mark as sent if email was successful
      if (emailSent) {

        booking.propertyAccuracyEmailSent = true;

        await booking.save();


        console.log(
          `✅ Property feedback email processed for booking ${booking._id}`
        );

      } else {

        console.log(
          `❌ Property feedback email failed for booking ${booking._id}`
        );

      }
    }


    console.log(
      "✅ Feedback reminder process completed."
    );

  } catch (error) {

    console.log(
      "❌ Feedback reminder error:",
      error
    );

  }
}


// ==========================================
// RUN EVERY DAY AT 9:00 AM
// ==========================================
cron.schedule("0 9 * * *", () => {

  console.log(
    "🔔 Running ChillSpot feedback reminder..."
  );

  sendFeedbackReminders();

});


module.exports = {
  sendFeedbackReminders
};