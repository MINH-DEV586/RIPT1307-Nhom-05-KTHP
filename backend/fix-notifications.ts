import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("MONGO_URI not found");
  process.exit(1);
}

const NotificationSchema = new mongoose.Schema({
  user: String,
  title: String,
  message: String,
  type: String,
  link: String,
  isRead: Boolean,
});

// Avoid OverwriteModelError
const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

async function fixLinks() {
  try {
    await mongoose.connect(mongoUri!);
    console.log("Connected to MongoDB");

    // Fix prescriptions
    const res1 = await Notification.updateMany(
      { link: { $regex: /^\/prescriptions\/[a-f0-9]+$/ } },
      { $set: { link: "/patient/prescriptions" } }
    );
    console.log("Fixed prescriptions:", res1.modifiedCount);

    // Fix medical-records
    const res2 = await Notification.updateMany(
      { link: { $regex: /^\/medical-records\/[a-f0-9]+$/ } },
      { $set: { link: "/patient/medical-records" } }
    );
    console.log("Fixed medical-records:", res2.modifiedCount);

    // Fix lab-results
    const res3 = await Notification.updateMany(
      { link: { $regex: /^\/lab-results\/[a-f0-9]+$/ } },
      { $set: { link: "/patient/test-results" } }
    );
    console.log("Fixed lab-results:", res3.modifiedCount);

    console.log("Database update complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error updating notifications:", error);
    process.exit(1);
  }
}

fixLinks();
