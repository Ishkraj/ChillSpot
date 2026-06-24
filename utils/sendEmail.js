require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_ADMIN,
    pass: process.env.EMAIL_PASS
  }
});

// ===============================
// SEND OTP
// ===============================
module.exports.sendOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"ChillSpot" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP - ChillSpot",
      html: `
        <h2>OTP Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      `
    });
    console.log("✅ OTP Email sent successfully");
  } catch (error) {
    console.log("❌ Error sending OTP Email:", error);
  }
};

// ===============================
// HOST – NEW BOOKING
// ===============================
module.exports.sendNewBookingEmailToHost = async (data) => {
  try {
    const { hostEmail, guestName, listingTitle, checkIn, checkOut, guests, totalPrice } = data;

    if (!hostEmail) {
      console.log("❌ Host email missing");
      return;
    }

    // 🔥 Fix: Date format handled safely outside the HTML string
    const inDate = checkIn ? new Date(checkIn).toDateString() : "N/A";
    const outDate = checkOut ? new Date(checkOut).toDateString() : "N/A";

    await transporter.sendMail({
      from: `"ChillSpot" <${process.env.EMAIL_USER}>`,
      to: hostEmail,
      subject: "🏡 New Booking Request",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>New Booking Request</h2>
          <p><b>Listing:</b> ${listingTitle}</p>
          <p><b>Guest:</b> ${guestName}</p>
          <p><b>Check-in:</b> ${inDate}</p>
          <p><b>Check-out:</b> ${outDate}</p>
          <p><b>Guests:</b> ${guests}</p>
          <p><b>Total:</b> ₹${totalPrice}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          
          <h3 style="color: #ff385c;">Please login to respond.</h3>
          <a href="https://chillspot-fw8c.onrender.com/bookings/host" style="background-color: #ff385c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Host Dashboard</a>
        </div>
      `
    });
    console.log("✅ Host email sent successfully");
  } catch (error) {
    console.log("❌ Error sending Host Email:", error);
  }
};

// ===============================
// GUEST – CONFIRMATION
// ===============================
module.exports.sendBookingConfirmedEmail = async (data) => {
  try {
    const inDate = data.checkIn ? new Date(data.checkIn).toDateString() : "N/A";
    const outDate = data.checkOut ? new Date(data.checkOut).toDateString() : "N/A";

    await transporter.sendMail({
      from: `"ChillSpot" <${process.env.EMAIL_USER}>`,
      to: data.guestEmail,
      subject: "✅ Booking Confirmed",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Booking Confirmed 🎉</h2>
          <p>Hello <b>${data.guestName}</b>,</p>
          <p><b>${data.listingTitle}</b></p>
          <p>Address: ${data.address}</p> 

          ${data.mapLink ? `
            <p>
              <strong>Exact Location Link:</strong><br/>
              <a href="${data.mapLink}" target="_blank" style="color: #007bff; text-decoration: none;">📍 Open in Google Maps</a>
            </p>
          ` : ""}
          
          <p>Check-in: ${inDate}</p>
          <p>Check-out: ${outDate}</p>
          <p><b>Total Amount: ₹${data.totalPrice}</b></p>

          <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-left: 5px solid #ffeeba; border-radius: 4px; margin-top: 20px;">
            <p style="margin: 0; font-size: 16px;"><b>Kindly pay the total amount at the location during your stay.</b></p>
          </div>

          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          Team ChillSpot
        </div>
      `
    });
    console.log("✅ Guest confirmation email sent successfully");
  } catch (error) {
    console.log("❌ Error sending Confirmation Email:", error);
  }
};

// ===============================
// GUEST – REJECTED
// ===============================
module.exports.sendBookingRejectedEmail = async (data) => {
  try {
    await transporter.sendMail({
      from: `"ChillSpot" <${process.env.EMAIL_USER}>`,
      to: data.guestEmail,
      subject: "❌ Booking Rejected",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Booking Rejected</h2>
          <p>Hello <b>${data.guestName}</b>,</p>
          <p><b>${data.listingTitle}</b></p>
          <p>We regret to inform you that your booking has been rejected by the host.</p>
          <p>We kindly request you to explore other available stays or locations for your travel plans.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          Team ChillSpot
        </div>
      `
    });
    console.log("✅ Guest rejection email sent successfully");
  } catch (error) {
    console.log("❌ Error sending Rejection Email:", error);
  }
};