/**
 * Seed script: Creates a default admin account.
 * Run with: node --env-file=.env --import tsx/esm src/seed.ts
 */
import { MongoClient } from "mongodb";
import { auth } from "../lib/auth.js";

const ADMIN_NAME = "Admin";
const ADMIN_EMAIL = "admin@hospital.com";
const ADMIN_PASSWORD = "123456789";

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection("user");

    // Check if admin already exists
    const existing = await usersCollection.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log("✅ Admin account already exists:", ADMIN_EMAIL);
      console.log("   Role:", existing.role);
      await client.close();
      return;
    }

    // Create the user via better-auth
    console.log("🔧 Creating admin account...");
    const result = await auth.api.signUpEmail({
      body: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });

    if (!result?.user?.id) {
      throw new Error("Failed to create user via better-auth");
    }

    // Upgrade role to 'admin' directly in MongoDB
    await usersCollection.updateOne(
      { email: ADMIN_EMAIL },
      { $set: { role: "admin" } }
    );

    console.log("✅ Admin account created successfully!");
    console.log("   Email   :", ADMIN_EMAIL);
    console.log("   Password:", ADMIN_PASSWORD);
    console.log("   Role    : admin");
  } catch (error) {
    console.error("❌ Seed failed:", (error as Error).message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seed();
