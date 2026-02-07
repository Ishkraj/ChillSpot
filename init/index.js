require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("../models/listing.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/airbnb";

const sampleListings = [
  {
    title: "Himalayan Retreat",
    description: "A tranquil haven in the Himalayas with breathtaking views.",
    images: [
      {
        filename: "listing1",
        url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470"
      }
    ],
    price: 2500,
    location: "Himachal Pradesh",
    country: "India",
    category: "Mountain"
  },
  {
    title: "Lakeview Cabin",
    description: "Cozy cabin with stunning lake views and peaceful surroundings.",
    images: [
      {
        filename: "listing2",
        url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511"
      }
    ],
    price: 1800,
    location: "Uttarakhand",
    country: "India",
    category: "Lakes"
  },
  {
    title: "City Lights Loft",
    description: "Modern loft in the heart of the city with skyline views.",
    images: [
      {
        filename: "listing3",
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
      }
    ],
    price: 3200,
    location: "Mumbai",
    country: "India",
    category: "Iconic Cities"
  },
  {
    title: "Countryside Farmstay",
    description: "Experience rural life with modern comforts.",
    images: [
      {
        filename: "listing4",
        url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"
      }
    ],
    price: 1500,
    location: "Punjab",
    country: "India",
    category: "Farm"
  },
  {
    title: "Luxury Pool Villa",
    description: "Exclusive villa with private pool and premium amenities.",
    images: [
      {
        filename: "listing5",
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945"
      }
    ],
    price: 5500,
    location: "Goa",
    country: "India",
    category: "Amazing Pools"
  },
  {
    title: "Riverside Camp",
    description: "Camping adventure by the river with bonfires and starry nights.",
    images: [
      {
        filename: "listing6",
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
      }
    ],
    price: 900,
    location: "Rishikesh",
    country: "India",
    category: "Camping"
  },
  {
    title: "Royal Castle Stay",
    description: "Stay in a heritage castle with royal ambiance.",
    images: [
      {
        filename: "listing7",
        url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"
      }
    ],
    price: 4500,
    location: "Rajasthan",
    country: "India",
    category: "Castles"
  },
  {
    title: "Minimalist Room",
    description: "Clean and modern room for solo travelers or couples.",
    images: [
      {
        filename: "listing8",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
      }
    ],
    price: 1200,
    location: "Bangalore",
    country: "India",
    category: "Room"
  },
  {
    title: "Trending Beach Bungalow",
    description: "A trending beachfront stay with nightlife and sea view.",
    images: [
      {
        filename: "listing9",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
      }
    ],
    price: 4700,
    location: "Varkala",
    country: "India",
    category: "Trending"
  }
];

async function seedDB() {
  try {
    await mongoose.connect(dbUrl);
    console.log("✅ MongoDB connected");

    await Listing.deleteMany({});
    console.log("🗑 Old listings removed");

    await Listing.insertMany(sampleListings);
    console.log("🔥 New listings inserted successfully");

    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
  }
}

seedDB();
