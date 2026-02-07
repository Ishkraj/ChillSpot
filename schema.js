const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().min(0).required(),
    location: Joi.string().required(),
    mapLink: Joi.string().uri().required(),
    category: Joi.string().required(),
    country: Joi.string().required()
  }).required(),

  deleteImages: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string().allow("")   // ✅ VERY IMPORTANT
  ).optional()
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required()
  }).required()
});
