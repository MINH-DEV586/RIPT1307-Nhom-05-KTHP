import mongoose from "mongoose";
import Notification from "../models/notification";

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }

  await mongoose.connect(mongoUri as string);
  console.log("Connected to MongoDB");

  try {
    const doctorId = new mongoose.Types.ObjectId();
    const patientId = new mongoose.Types.ObjectId();

    const n1 = await Notification.create({
      user: doctorId,
      title: "Test: Bệnh nhân đặt lịch hẹn",
      message: "Bệnh nhân Nguyễn A đã đặt lịch vào 20/05/2026",
      type: "system",
      link: "/appointments/123",
    });

    const n2 = await Notification.create({
      user: patientId,
      title: "Test: Bác sĩ xác nhận",
      message: "Bác sĩ B đã xác nhận lịch hẹn của bạn",
      type: "system",
      link: "/appointments/123",
    });

    console.log("Created notifications:", n1._id.toString(), n2._id.toString());

    const docs = await Notification.find({}).sort({ createdAt: -1 }).limit(5).lean();
    console.log("Latest notifications:", docs.map(d => ({ id: d._id, user: d.user, title: d.title })));
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
