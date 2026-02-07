if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const listingController = require("../controllers/listing.js");

const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// =======================
// ALL LISTINGS
// =======================

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.array("listing[images]"),   // 🔥 FIRST multer
    validateListing,                   // 🔥 THEN Joi
    wrapAsync(listingController.createListing)
  );

// =======================
// NEW LISTING FORM
// =======================

router.get("/new", isLoggedIn, listingController.renderNewForm);

// =======================
// SEARCH
// =======================

router.get("/search", wrapAsync(listingController.searchListings));

// =======================
// SHOW / UPDATE / DELETE
// =======================

router
  .route("/:id")
  .get(isLoggedIn, wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.array("listing[images]"),   // 🔥 FIRST multer
    validateListing,                   // 🔥 THEN Joi
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

// =======================
// EDIT FORM
// =======================

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

// =======================
// CATEGORY FILTER
// =======================

router.get(
  "/category/:category",
  wrapAsync(listingController.filterByCategory)
);

module.exports = router;
