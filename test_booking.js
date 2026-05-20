const http = require("http");

async function run() {
  try {
    // 1. Create a user (patient)
    const userPayload = {
      email: "testpatient@medflow.com",
      password: "password123",
      name: "Test Patient",
      role: "patient"
    };

    let res = await fetch("http://localhost:5001/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPayload)
    });
    
    // Ignore if already exists, try to sign in
    res = await fetch("http://localhost:5001/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "testpatient@medflow.com", password: "password123" })
    });
    
    let cookie = res.headers.get("set-cookie");
    if (!cookie) {
      console.log("No cookie returned");
      // Could be already signed in, wait for better auth, actually better auth is /api/auth/sign-in
    }

    const authHeaders = {
      "Content-Type": "application/json",
      "Cookie": cookie || ""
    };

    // 2. Get doctors
    res = await fetch("http://localhost:5001/api/appointments/doctors", {
      headers: authHeaders
    });
    const doctors = await res.json();
    console.log("Doctors:", doctors.length);
    if (doctors.length === 0) {
      console.log("No doctors found");
      return;
    }
    const doctorId = doctors[0]._id || doctors[0].id;

    // 3. Book appointment
    const bookingPayload = {
      doctorId,
      patientType: "self",
      patientName: "",
      date: "2026-05-25",
      timeSlot: "09:00",
      type: "offline",
      symptoms: "Headache",
      notes: ""
    };

    res = await fetch("http://localhost:5001/api/appointments/book", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(bookingPayload)
    });
    
    const body = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", body);

  } catch (err) {
    console.error(err);
  }
}

run();
