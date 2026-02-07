const Listing = require("../models/listing");
const Review = require("../models/review");

// =======================
// CREATE REVIEW
// =======================
module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  const newReview = new Review(req.body.review);

  // 🔥 VERY IMPORTANT LINE
  newReview.author = req.user._id;

  await newReview.save();

  listing.reviews.push(newReview);
  await listing.save();

  req.flash("success", "New Review Created!");
  res.redirect(`/listings/${listing._id}`);
};

// =======================
// DELETE REVIEW
// =======================
module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, {
    $pull: { reviews: reviewId }
  });

  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review Deleted!");
  res.redirect(`/listings/${id}`);
};
