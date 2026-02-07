const Listing = require("../models/listing.js");
const { cloudinary } = require("../cloudConfig");

// =======================
// CONFIDENCE CALCULATOR
// =======================
function calculateConfidence(listing) {
  let score = 0;

  if (listing.description && listing.description.length > 50) score += 20;

  if (listing.images && listing.images.length > 0) score += 20;
  if (listing.images && listing.images.length >= 3) score += 10;

  if (listing.price >= 500 && listing.price <= 6000) score += 10;

  if (listing.reviews && listing.reviews.length > 0) score += 30;

  return Math.min(score, 100);
}

// =======================
// TRUST REASONS
// =======================
function generateTrustReasons(listing) {
  let reasons = [];

  if (listing.description && listing.description.length > 50)
    reasons.push("✔ Detailed description provided");
  else reasons.push("⚠ Description is too short");

  if (listing.images && listing.images.length >= 3)
    reasons.push("✔ Multiple real images uploaded");
  else if (listing.images.length > 0)
    reasons.push("⚠ Limited images uploaded");
  else reasons.push("❌ No images uploaded");

  if (listing.price >= 500 && listing.price <= 6000)
    reasons.push("✔ Price looks reasonable");
  else reasons.push("⚠ Price may be unusual");

  if (listing.reviews && listing.reviews.length > 0)
    reasons.push("✔ Real guest reviews available");
  else reasons.push("⚠ No reviews yet");

  if (listing.owner) reasons.push("✔ Listing owner verified");

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
    req.flash("error", "Listing you requested does not exist.");
    return res.redirect("/listings");
  }

  const confidenceScore = calculateConfidence(listing);
  const trustReasons = generateTrustReasons(listing);

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

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const listings = await Listing.find({
    $or: [{ title: regex }, { location: regex }, { country: regex }]
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
    req.flash("error", "Listing does not exist");
    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", { listing });
};

// =======================
// UPDATE LISTING
// =======================
module.exports.updateListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  Object.assign(listing, req.body.listing);

  if (req.body.deleteImages) {
    const filenames = JSON.parse(req.body.deleteImages);
    for (let filename of filenames)
      await cloudinary.uploader.destroy(filename);

    listing.images = listing.images.filter(
      (img) => !filenames.includes(img.filename)
    );
  }

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
