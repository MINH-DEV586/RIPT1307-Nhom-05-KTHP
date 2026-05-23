const mongoose = require('mongoose');
require('dotenv').config();

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
}, { timestamps: true });

const Medicine = mongoose.model("Medicine", MedicineSchema);

const medicines = [
  { name: "Paracetamol 500mg", category: "Giảm đau", stock: 1000, unit: "Viên", price: 2000, expiryDate: new Date("2026-12-31") },
  { name: "Amoxicillin 500mg", category: "Kháng sinh", stock: 500, unit: "Viên", price: 5000, expiryDate: new Date("2025-10-20") },
  { name: "Ibuprofen 400mg", category: "Kháng viêm", stock: 300, unit: "Viên", price: 3500, expiryDate: new Date("2026-06-15") },
  { name: "Cetirizine 10mg", category: "Chống dị ứng", stock: 200, unit: "Viên", price: 3000, expiryDate: new Date("2027-01-01") },
  { name: "Omeprazole 20mg", category: "Dạ dày", stock: 400, unit: "Viên", price: 8000, expiryDate: new Date("2025-12-31") },
  { name: "Gaviscon", category: "Dạ dày", stock: 100, unit: "Gói", price: 15000, expiryDate: new Date("2026-05-10") },
  { name: "Augmentin 1g", category: "Kháng sinh", stock: 150, unit: "Viên", price: 25000, expiryDate: new Date("2025-08-22") },
  { name: "Vitamin C 500mg", category: "Bổ sung", stock: 800, unit: "Viên", price: 1500, expiryDate: new Date("2027-12-31") }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    await Medicine.deleteMany({});
    await Medicine.insertMany(medicines);
    console.log("Seeded medicines successfully");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

seed();
