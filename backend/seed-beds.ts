import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("MONGO_URI not found");
  process.exit(1);
}

const DEPARTMENTS = ["Nội tổng quát", "Tim mạch", "Thần kinh", "Nhi khoa", "Hồi sức cấp cứu"];

const BedSchema = new mongoose.Schema({
  bedNumber: { type: String, required: true, unique: true },
  type: { type: String, default: "normal" },
  status: { type: String, default: "available" },
  patientId: { type: String, default: null },
  department: { type: String, required: true },
  floor: { type: String, required: true },
}, { timestamps: true });

const Bed = mongoose.model("Bed", BedSchema);

async function seedBeds() {
  try {
    await mongoose.connect(mongoUri!);
    console.log("Connected to MongoDB");

    // Clear existing beds
    await Bed.deleteMany({});

    const beds = [];

    for (let floor = 1; floor <= 5; floor++) {
      for (let room = 1; room <= 5; room++) {
        for (let bedIdx = 1; bedIdx <= 4; bedIdx++) {
          const dept = DEPARTMENTS[(floor - 1) % DEPARTMENTS.length];
          // Floor 5 Room 5 is VIP
          const type = (floor === 5 && room === 5) ? "vip" : (dept === "Hồi sức cấp cứu" ? "emergency" : "normal");
          
          beds.push({
            bedNumber: `F${floor}R${room}B${bedIdx}`,
            type: type,
            status: "available",
            department: dept,
            floor: floor.toString(),
          });
        }
      }
    }

    await Bed.insertMany(beds);
    console.log(`Successfully seeded ${beds.length} beds.`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding beds:", error);
    process.exit(1);
  }
}

seedBeds();
