const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema(
  {
    title: {
      type: String,
    },
    description: String,
    images: [
      {
        url: String,
        filename: String,
      },
    ],
    
    // ==========================================
    // 🔥 HYBRID PRICING (DAILY vs MONTHLY RENT)
    // ==========================================
    pricingType: {
      type: String,
      enum: ["Daily", "Monthly", "Both"],
      default: "Daily",
    },
    price: Number,        
    monthlyPrice: Number, 
    // ==========================================

    // ==========================================
    // ⚡ INSTANT BOOK FEATURE
    // ==========================================
    isInstantBook: {
      type: Boolean,
      default: false, // Default manual approval rahega
    },
    // ==========================================

    location: String,
    mapLink: String,
    country: String,
    category: String,
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    confidenceScore: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// ⭐⭐⭐⭐⭐
// AVERAGE RATING VIRTUAL
// ⭐⭐⭐⭐⭐
listingSchema.virtual("avgRating").get(function () {
  if (!this.reviews || this.reviews.length === 0) return 0;

  let total = 0;
  for (let review of this.reviews) {
    total += review.rating;
  }
  return (total / this.reviews.length).toFixed(1);
});

listingSchema.set("toJSON", { virtuals: true });
listingSchema.set("toObject", { virtuals: true });

// 🧹 delete all reviews if listing deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({
      _id: { $in: listing.reviews },
    });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;