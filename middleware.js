const Listing = require("./models/listing.js");
const { listingSchema, reviewSchema } = require("./schema.js");

// LOGIN CHECK
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in first!");
    return res.redirect("/login");
  }
  next();
};

// SAVE REDIRECT
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// OWNER CHECK
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not the owner of this listing");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

// LISTING VALIDATION
module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);

  if (error) {
    const msg = error.details.map(el => el.message).join(", ");
    console.log("❌ LISTING VALIDATION ERROR:", msg);

    req.flash("error", msg);
    return res.redirect("/listings/new");
  }

  next();
};

// REVIEW VALIDATION
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    const msg = error.details.map(el => el.message).join(", ");
    console.log("❌ REVIEW VALIDATION ERROR:", msg);

    req.flash("error", msg);
    return res.redirect("back");
  }

  next();
};
const Review = require("./models/review");

module.exports.isReviewAuthor = async (req, res, next) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You are not allowed to do this!");
    return res.redirect("back");
  }

  next();
};
