const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hospital_management";

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    const db = mongoose.connection.db;

    // Check all users with status "admitted"
    const admittedUsers = await db.collection("users").find({ status: "admitted" }).toArray();
    console.log(`Found ${admittedUsers.length} admitted users:`);
    for (const u of admittedUsers) {
      console.log(`- Patient ID: ${u._id} (${u.name}, Email: ${u.email}), admittedAt: ${u.admittedAt}`);
      
      // Get all prescriptions for this patient
      const prescriptions = await db.collection("prescriptions").find({ patientId: u._id.toString() }).toArray();
      console.log(`  Prescriptions:`);
      for (const p of prescriptions) {
        console.log(`    * ID: ${p._id}, diagnosis: ${p.diagnosis}, status: ${p.status}, createdAt: ${p.createdAt}`);
      }

      // Get active invoice for this patient
      const invoices = await db.collection("invoices").find({ patientId: u._id.toString() }).toArray();
      console.log(`  Invoices in DB:`);
      for (const inv of invoices) {
        console.log(`    * ID: ${inv._id}, status: ${inv.status}, items count: ${inv.items?.length}`);
        inv.items?.forEach(item => {
          console.log(`      - ${item.description}: ${item.totalPrice}`);
        });
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
