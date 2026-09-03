const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { cloudinary } = require("../cloudConfig");

// =======================
// CONFIDENCE CALCULATOR
// =======================
async function calculateConfidence(listing) {
  let score = 75;

  // =======================
  // LISTING COMPLETENESS
  // =======================
  if (!listing.title || listing.title.length < 10) {
    score -= 5;
  }

  if (!listing.description || listing.description.length < 50) {
    score -= 10;
  } else if (listing.description.length >= 100) {
    score += 5;
  }

  if (!listing.location) {
    score -= 5;
  }

  if (!listing.category) {
    score -= 3;
  }

  // =======================
  // IMAGES
  // =======================
  const imageCount = listing.images?.length || 0;

  if (imageCount === 0) {
    score -= 15;
  } else if (imageCount === 1) {
    score -= 8;
  } else if (imageCount >= 3) {
    score += 5;
  } else {
    score += 2;
  }

  // =======================
  // NORMAL GUEST REVIEWS
  // =======================
  const reviews = listing.reviews || [];
  const reviewCount = reviews.length;

  if (reviewCount === 0) {
    score -= 5;
  } else if (reviewCount >= 3) {
    score += 3;
  }

  if (reviewCount >= 5) {
    score += 4;
  }

  // =======================
  // AVERAGE REVIEW RATING
  // =======================
  if (reviewCount > 0) {
    const totalRating = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    const averageRating = totalRating / reviewCount;

    if (averageRating >= 4.5) {
      score += 8;
    } else if (averageRating >= 4) {
      score += 5;
    } else if (averageRating < 3) {
      score -= 8;
    } else if (averageRating < 3.5) {
      score -= 4;
    }
  }

  // =======================
  // OWNER / VERIFICATION
  // =======================
  if (listing.owner) {
    score += 5;
  }

  // =================================================
  // 🔥 REAL BOOKING FEEDBACK
  // =================================================

  const bookings = await Booking.find({
    listing: listing._id,
    status: "confirmed"
  });

  // =======================
  // HOST BEHAVIOUR
  // HIGH WEIGHT
  // =======================

  const hostFeedbacks = bookings
    .filter(
      (booking) =>
        booking.hostBehaviorFeedback &&
        booking.hostBehaviorFeedback.rating
    )
    .map(
      (booking) =>
        Number(booking.hostBehaviorFeedback.rating)
    );

  if (hostFeedbacks.length > 0) {
    const hostAverage =
      hostFeedbacks.reduce(
        (sum, rating) => sum + rating,
        0
      ) / hostFeedbacks.length;

    if (hostAverage >= 4.5) {
      score += 12;
    } else if (hostAverage >= 4) {
      score += 8;
    } else if (hostAverage >= 3) {
      score += 2;
    } else if (hostAverage >= 2) {
      score -= 8;
    } else {
      score -= 15;
    }
  }

  // =======================
  // PROPERTY ACCURACY
  // HIGH WEIGHT
  // =======================

  const propertyFeedbacks = bookings
    .filter(
      (booking) =>
        booking.propertyAccuracyFeedback &&
        booking.propertyAccuracyFeedback.rating
    )
    .map(
      (booking) =>
        Number(booking.propertyAccuracyFeedback.rating)
    );

  if (propertyFeedbacks.length > 0) {
    const propertyAverage =
      propertyFeedbacks.reduce(
        (sum, rating) => sum + rating,
        0
      ) / propertyFeedbacks.length;

    if (propertyAverage >= 4.5) {
      score += 15;
    } else if (propertyAverage >= 4) {
      score += 10;
    } else if (propertyAverage >= 3) {
      score += 2;
    } else if (propertyAverage >= 2) {
      score -= 10;
    } else {
      score -= 20;
    }
  }

  // =======================
  // FINAL SCORE
  // =======================
  return Math.max(
    0,
    Math.min(Math.round(score), 100)
  );
};


// =======================
// TRUST REASONS
// =======================
async function generateTrustReasons(listing) {
  let reasons = [];

  // =======================
  // DESCRIPTION
  // =======================
  if (listing.description && listing.description.length >= 100) {
    reasons.push("✔ Detailed listing information provided");
  } else if (listing.description && listing.description.length >= 50) {
    reasons.push("✔ Good listing description provided");
  } else {
    reasons.push("⚠ Description could be more detailed");
  }

  // =======================
  // IMAGES
  // =======================
  const imageCount = listing.images?.length || 0;

  if (imageCount >= 3) {
    reasons.push("✔ Multiple images uploaded");
  } else if (imageCount > 0) {
    reasons.push("⚠ Limited images uploaded");
  } else {
    reasons.push("❌ No images uploaded");
  }

  // =======================
  // NORMAL REVIEWS
  // =======================
  const reviewCount = listing.reviews?.length || 0;

  if (reviewCount >= 5) {
    reasons.push("✔ 5+ guest reviews available");
  } else if (reviewCount > 0) {
    reasons.push("✔ Guest reviews available");
  } else {
    reasons.push("⚠ No guest reviews yet");
  }

  // =======================
  // AVERAGE RATING
  // =======================
  if (reviewCount > 0) {
    const totalRating = listing.reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    const averageRating = totalRating / reviewCount;

    if (averageRating >= 4) {
      reasons.push(
        `✔ Strong guest rating (${averageRating.toFixed(1)}/5)`
      );
    } else if (averageRating < 3) {
      reasons.push(
        `⚠ Low guest rating (${averageRating.toFixed(1)}/5)`
      );
    }
  }

  // =================================================
  // 🔥 REAL BOOKING FEEDBACK
  // =================================================

  const bookings = await Booking.find({
    listing: listing._id,
    status: "confirmed"
  });

  // =======================
  // HOST BEHAVIOUR FEEDBACK
  // =======================
  const hostFeedbacks = bookings
    .filter(
      (booking) =>
        booking.hostBehaviorFeedback &&
        booking.hostBehaviorFeedback.rating
    )
    .map(
      (booking) =>
        Number(booking.hostBehaviorFeedback.rating)
    );

  if (hostFeedbacks.length > 0) {
    const hostAverage =
      hostFeedbacks.reduce(
        (sum, rating) => sum + rating,
        0
      ) / hostFeedbacks.length;

    if (hostAverage >= 4) {
      reasons.push(
        `✔ Guests rated host behaviour ${hostAverage.toFixed(1)}/5`
      );
    } else {
      reasons.push(
        `⚠ Guests rated host behaviour ${hostAverage.toFixed(1)}/5`
      );
    }
  }

  // =======================
  // PROPERTY ACCURACY FEEDBACK
  // =======================
  const propertyFeedbacks = bookings
    .filter(
      (booking) =>
        booking.propertyAccuracyFeedback &&
        booking.propertyAccuracyFeedback.rating
    )
    .map(
      (booking) =>
        Number(booking.propertyAccuracyFeedback.rating)
    );

  if (propertyFeedbacks.length > 0) {
    const propertyAverage =
      propertyFeedbacks.reduce(
        (sum, rating) => sum + rating,
        0
      ) / propertyFeedbacks.length;

    if (propertyAverage >= 4) {
      reasons.push(
        `✔ Guests rated property accuracy ${propertyAverage.toFixed(1)}/5`
      );
    } else {
      reasons.push(
        `⚠ Property accuracy rated ${propertyAverage.toFixed(1)}/5`
      );
    }
  }

  // =======================
  // OWNER
  // =======================
  if (listing.owner) {
    reasons.push("✔ Listing owner verified");
  }

  return reasons;
}


// =======================
// ALL LISTINGS
// =======================
module.exports.index = async (req, res) => {
  const listings = await Listing.find({})
    .populate({
      path: "reviews",
      populate: { path: "author" }
    });

  res.render("listings/index.ejs", {
    listings,
    category: null,
    searchQuery: null,
    message: null
  });
};


// =======================
// NEW FORM
// =======================
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};


// =======================
// SHOW LISTING
// =======================
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" }
    })
    .populate("owner");

  if (!listing) {
    req.flash(
      "error",
      "Listing you requested does not exist."
    );

    return res.redirect("/listings");
  }

  // 🔥 Confidence includes actual booking feedback
  const confidenceScore = await calculateConfidence(listing);

  // 🔥 Trust reasons also include actual booking feedback
  const trustReasons = await generateTrustReasons(listing);

  res.render("listings/show.ejs", {
    listing,
    confidenceScore,
    trustReasons,
    currUser: req.user
  });
};


// =======================
// CATEGORY FILTER
// =======================
module.exports.filterByCategory = async (req, res) => {
  const { category } = req.params;

  const listings = await Listing.find({ category })
    .populate({
      path: "reviews",
      populate: { path: "author" }
    });

  res.render("listings/index.ejs", {
    listings,
    category,
    searchQuery: null,
    message: null
  });
};


// =======================
// SEARCH
// =======================
module.exports.searchListings = async (req, res) => {
  const q = req.query.q?.trim();

  if (!q) return res.redirect("/listings");

  const regex = new RegExp(
    q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i"
  );

  const listings = await Listing.find({
    $or: [
      { title: regex },
      { location: regex },
      { country: regex }
    ]
  }).populate({
    path: "reviews",
    populate: { path: "author" }
  });

  const message =
    listings.length === 0
      ? `No listings found for "${q}"`
      : `Found ${listings.length} listing(s) for "${q}"`;

  res.render("listings/index.ejs", {
    listings,
    category: null,
    searchQuery: q,
    message
  });
};


// =======================
// CREATE LISTING
// =======================
module.exports.createListing = async (req, res, next) => {
  try {
    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    newListing.images =
      req.files?.map((f) => ({
        url: f.path,
        filename: f.filename
      })) || [];

    // ✅ mark user as host
    req.user.isHost = true;
    await req.user.save();

    await newListing.save();

    req.flash("success", "New Listing Created!");

    res.redirect("/listings");

  } catch (err) {
    next(err);
  }
};


// =======================
// EDIT FORM
// =======================
module.exports.renderEditForm = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    req.flash(
      "error",
      "Listing does not exist"
    );

    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", {
    listing
  });
};


// =======================
// UPDATE LISTING
// =======================
module.exports.updateListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  // ✅ Manually update fields
  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.location = req.body.listing.location;
  listing.mapLink = req.body.listing.mapLink;
  listing.country = req.body.listing.country;
  listing.category = req.body.listing.category;

  // 🔥 HYBRID PRICING FIX
  listing.pricingType = req.body.listing.pricingType;
  listing.price = req.body.listing.price || null;
  listing.monthlyPrice =
    req.body.listing.monthlyPrice || null;

  // ⚡ INSTANT BOOK TOGGLE FIX
  listing.isInstantBook =
    !!req.body.listing.isInstantBook;

  // Delete images
  if (req.body.deleteImages) {
    const filenames =
      JSON.parse(req.body.deleteImages);

    for (let filename of filenames) {
      await cloudinary.uploader.destroy(filename);
    }

    listing.images = listing.images.filter(
      (img) => !filenames.includes(img.filename)
    );
  }

  // Add new images
  if (req.files?.length > 0) {
    listing.images.push(
      ...req.files.map((f) => ({
        url: f.path,
        filename: f.filename
      }))
    );
  }

  await listing.save();

  req.flash("success", "Listing Updated!");

  res.redirect(`/listings/${listing._id}`);
};


// =======================
// DELETE LISTING
// =======================
module.exports.destroyListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  for (let img of listing.images || []) {
    await cloudinary.uploader.destroy(img.filename);
  }

  await Listing.findByIdAndDelete(req.params.id);

  req.flash("success", "Listing Deleted!");

  res.redirect("/listings");
};