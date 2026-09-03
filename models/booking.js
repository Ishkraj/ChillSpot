const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bookingSchema = new Schema({

  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    required: true
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  checkIn: {
    type: Date,
    required: true
  },

  checkOut: {
    type: Date,
    required: true
  },

  guests: {
    type: Number,
    required: true
  },

  totalPrice: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "confirmed", "rejected"],
    default: "pending"
  },

  address: {
    type: String
  },

  // ===============================
  // GUEST FEEDBACK
  // ===============================

  hostBehaviorFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },

  propertyAccuracyFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});
// ===============================
// BOOKING DATE INDEX
// ===============================

bookingSchema.index({
  listing: 1,
  status: 1,
  checkIn: 1,
  checkOut: 1
});

module.exports = mongoose.model("Booking", bookingSchema);