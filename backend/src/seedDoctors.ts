import { MongoClient } from "mongodb";
import { auth } from "./lib/auth";

const DOCTORS = [
  {
    name: "BS. Nguyễn Văn A",
    email: "doctor.a@hospital.com",
    password: "password123",
    role: "doctor",
    specialization: "Nội khoa",
    experience: "10 năm",
    consultationFee: 300000,
    rating: 4.8,
    isOnline: true,
  },
  {
    name: "BS. Trần Thị B",
    email: "doctor.b@hospital.com",
    password: "password123",
    role: "doctor",
    specialization: "Nhi khoa",
    experience: "8 năm",
    consultationFee: 250000,
    rating: 4.9,
    isOnline: false,
  },
  {
    name: "BS. Lê Văn C",
    email: "doctor.c@hospital.com",
    password: "password123",
    role: "doctor",
    specialization: "Ngoại khoa",
    experience: "15 năm",
    consultationFee: 500000,
    rating: 4.7,
    isOnline: true,
  },
  {
    name: "BS. Phạm Minh D",
    email: "doctor.d@hospital.com",
    password: "password123",
    role: "doctor",
    specialization: "Tim mạch",
    experience: "12 năm",
    consultationFee: 400000,
    rating: 5.0,
    isOnline: true,
  }
];

async function seedDoctors() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not defined");

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection("user");

    for (const doc of DOCTORS) {
      const existing = await usersCollection.findOne({ email: doc.email });
      if (existing) {
        console.log(`✅ Doctor ${doc.email} already exists.`);
        continue;
      }

      console.log(`🔧 Creating doctor ${doc.name}...`);
      const result = await auth.api.signUpEmail({
        body: {
          name: doc.name,
          email: doc.email,
          password: doc.password,
        },
      });

      if (result?.user?.id) {
        await usersCollection.updateOne(
          { email: doc.email },
          { 
            $set: { 
              role: "doctor",
              specialization: doc.specialization,
              experience: doc.experience,
              consultationFee: doc.consultationFee,
              rating: doc.rating,
              isOnline: doc.isOnline,
              status: "active"
            } 
          }
        );
      }
    }
    console.log("✅ All doctors seeded successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedDoctors();
