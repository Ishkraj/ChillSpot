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




// SEND OTP
// SEND OTP
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

  const {
    hostEmail,
    guestName,
    listingTitle,
    checkIn,
    checkOut,
    guests,
    totalPrice
  } = data;



  // ❌ If email missing
  if (!hostEmail) {
    console.log("❌ Host email missing");
    return;
  }

  // ✅ Send Mail
  await transporter.sendMail({
    from: `"ChillSpot" <${process.env.EMAIL_USER}>`,
    to: hostEmail,
    subject: "🏡 New Booking Request",

    html: `
      <h2>New Booking Request</h2>

      <p><b>Listing:</b> ${listingTitle}</p>
      <p><b>Guest:</b> ${guestName}</p>
      <p><b>Check-in:</b> ${new Date(checkIn).toDateString()}</p>
      <p><b>Check-out:</b> ${new Date(checkOut).toDateString()}</p>
      <p><b>Guests:</b> ${guests}</p>
      <p><b>Total:</b> ₹${totalPrice}</p>

      <hr/>
      <p>Please login to respond.</p>
    `
  });

  console.log("✅ Host email sent successfully");
};




// ===============================
// GUEST – CONFIRMATION
// ===============================
module.exports.sendBookingConfirmedEmail = async (data) => {

  await transporter.sendMail({
    from: `"ChillSpot" <${process.env.EMAIL_USER}>`,
    to: data.guestEmail,
    subject: "✅ Booking Confirmed",
    html: `
      <h2>Booking Confirmed 🎉</h2>

      <p>Hello ${data.guestName}</p>

      <p><b>${data.listingTitle}</b></p>

      <p>Address: ${data.address}</p> 


      ${data.mapLink ? `
        <p>
          <strong>Exact Location Link:</strong><br/>
          <a href="${data.mapLink}" target="_blank">
            📍 Open in Google Maps
          </a>
        </p>
      ` : ""}

      
      <p>Check-in: ${new Date(data.checkIn).toDateString()}</p>
      <p>Check-out: ${new Date(data.checkOut).toDateString()}</p>

      <p>Total: ₹${data.totalPrice}</p>

      <p>Kindly pay the total amount at the location during your stay</p>

      <hr/>
      Team ChillSpot
    `
  });
};



// ===============================
// GUEST – REJECTED
// ===============================
module.exports.sendBookingRejectedEmail = async (data) => {

  await transporter.sendMail({
    from: `"ChillSpot" <${process.env.EMAIL_USER}>`,
    to: data.guestEmail,
    subject: "❌ Booking Rejected",
    html: `
      <h2>Booking Rejected</h2>

      <p>Hello ${data.guestName}</p>

      <p>${data.listingTitle}</p>

      <p>We regret to inform you that your booking has been rejected by the host.</p>

      <p>We kindly request you to explore other available stays or locations for your travel plans.</p>

      Team ChillSpot
    `
  });
};
