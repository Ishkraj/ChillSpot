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
    const {
      hostEmail,
      guestName,
      listingTitle,
      checkIn,
      checkOut,
      guests,
      totalPrice
    } = data;

    if (!hostEmail) {
      console.log("❌ Host email missing");
      return;
    }

    const inDate = checkIn
      ? new Date(checkIn).toDateString()
      : "N/A";

    const outDate = checkOut
      ? new Date(checkOut).toDateString()
      : "N/A";

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

          <h3 style="color: #ff385c;">
            Please login to respond.
          </h3>

          <a
            href="https://chillspot-fw8c.onrender.com/bookings/host"
            style="
              background-color: #ff385c;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              display: inline-block;
            "
          >
            Go to Host Dashboard
          </a>
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
    const inDate = data.checkIn
      ? new Date(data.checkIn).toDateString()
      : "N/A";

    const outDate = data.checkOut
      ? new Date(data.checkOut).toDateString()
      : "N/A";

    await transporter.sendMail({
      from: `"ChillSpot" <${process.env.EMAIL_USER}>`,
      to: data.guestEmail,
      subject: "✅ Booking Confirmed",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">

          <h2>Booking Confirmed 🎉</h2>

          <p>Hello <b>${data.guestName}</b>,</p>

          <p>
            <b>${data.listingTitle}</b>
          </p>

          <p>
            Address: ${data.address}
          </p>

          ${
            data.mapLink
              ? `
                <p>
                  <strong>Exact Location Link:</strong><br/>
                  <a
                    href="${data.mapLink}"
                    target="_blank"
                    style="
                      color: #007bff;
                      text-decoration: none;
                    "
                  >
                    📍 Open in Google Maps
                  </a>
                </p>
              `
              : ""
          }

          <p>
            Check-in: ${inDate}
          </p>

          <p>
            Check-out: ${outDate}
          </p>

          <p>
            <b>Total Amount: ₹${data.totalPrice}</b>
          </p>

          <div
            style="
              background-color: #fff3cd;
              color: #856404;
              padding: 15px;
              border-left: 5px solid #ffeeba;
              border-radius: 4px;
              margin-top: 20px;
            "
          >
            <p style="margin: 0; font-size: 16px;">
              <b>
                Kindly pay the total amount at the location during your stay.
              </b>
            </p>
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

          <p>
            Hello <b>${data.guestName}</b>,
          </p>

          <p>
            <b>${data.listingTitle}</b>
          </p>

          <p>
            We regret to inform you that your booking
            has been rejected by the host.
          </p>

          <p>
            We kindly request you to explore other
            available stays or locations for your travel plans.
          </p>

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


// ===============================
// GUEST – CHECK-IN HOST FEEDBACK
// ===============================
module.exports.sendHostBehaviorFeedbackEmail = async (data) => {
  try {

    if (!data.guestEmail) {
      console.log("❌ Feedback email recipient missing");
      return false;
    }

    const info = await transporter.sendMail({
      from: `"ChillSpot" <${process.env.EMAIL_USER}>`,
      to: data.guestEmail,
      subject: "🤝 How was your host experience?",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">

          <h2>🤝 How was your host experience?</h2>

          <p>
            Hello <b>${data.guestName}</b>,
          </p>

          <p>
            Your stay at
            <strong>${data.listingTitle}</strong>
            starts today.
          </p>

          <p>
            We care about your experience at ChillSpot.
            Please share how the host is treating you.
          </p>

          <hr style="border: 1px solid #eee; margin: 20px 0;" />

          <h3>Host Behaviour Feedback</h3>

          <p>
            Please rate your host from
            <strong>1 to 5 stars</strong>
            after checking in.
          </p>

          <p>
            You can submit your feedback from
            <strong>My Bookings</strong> on ChillSpot.
          </p>

          <a
            href="https://chillspot-fw8c.onrender.com/bookings"
            style="
              background-color: #ff385c;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              display: inline-block;
            "
          >
            Give Host Feedback
          </a>

          <hr style="border: 1px solid #eee; margin: 20px 0;" />

          <p>
            Your honest feedback helps us maintain
            a trustworthy hosting community.
          </p>

          <p>Team ChillSpot</p>

        </div>
      `
    });

    console.log("✅ Host behaviour feedback email sent successfully");
    console.log("📧 Feedback Message ID:", info.messageId);
    console.log("📨 Accepted:", info.accepted);
    console.log("❌ Rejected:", info.rejected);

    return true;

  } catch (error) {

    console.log(
      "❌ Error sending Host Behaviour Feedback Email:",
      error
    );

    return false;
  }
};


// ===============================
// GUEST – CHECK-OUT PROPERTY FEEDBACK
// ===============================
module.exports.sendPropertyAccuracyFeedbackEmail = async (data) => {
  try {

    if (!data.guestEmail) {
      console.log("❌ Feedback email recipient missing");
      return false;
    }

    const info = await transporter.sendMail({
      from: `"ChillSpot" <${process.env.EMAIL_USER}>`,
      to: data.guestEmail,
      subject: "🏡 Did the property match the listing?",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">

          <h2>🏡 How accurate was your stay?</h2>

          <p>
            Hello <b>${data.guestName}</b>,
          </p>

          <p>
            We hope you had a great stay at
            <strong>${data.listingTitle}</strong>.
          </p>

          <p>
            Now that your stay is complete, please tell us
            whether the actual property matched the photos
            and description shown on ChillSpot.
          </p>

          <hr style="border: 1px solid #eee; margin: 20px 0;" />

          <h3>Property Accuracy Feedback</h3>

          <p>
            Please rate how accurately the property matched
            its listing from <strong>1 to 5 stars</strong>.
          </p>

          <p>
            You can submit your feedback from
            <strong>My Bookings</strong> on ChillSpot.
          </p>

          <a
            href="https://chillspot-fw8c.onrender.com/bookings"
            style="
              background-color: #ff385c;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              display: inline-block;
            "
          >
            Give Property Feedback
          </a>

          <hr style="border: 1px solid #eee; margin: 20px 0;" />

          <p>
            Your honest feedback helps us keep listings
            accurate and trustworthy.
          </p>

          <p>Team ChillSpot</p>

        </div>
      `
    });

    console.log(
      "✅ Property accuracy feedback email sent successfully"
    );

    console.log(
      "📧 Feedback Message ID:",
      info.messageId
    );

    console.log(
      "📨 Accepted:",
      info.accepted
    );

    console.log(
      "❌ Rejected:",
      info.rejected
    );

    return true;

  } catch (error) {

    console.log(
      "❌ Error sending Property Accuracy Feedback Email:",
      error
    );

    return false;
  }
};