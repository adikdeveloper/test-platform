const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const studentRoutes = require("./src/routes/studentRoutes");
const { initializeDataStore } = require("./src/config/adminData");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const BODY_LIMIT = "25mb";
const allowedOrigins = String(
  process.env.FRONTEND_URL || "http://127.0.0.1:5173,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS ruxsati yo'q"));
    }
  })
);
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

app.get("/", (_req, res) => {
  res.json({
    message: "Backend ishlayapti"
  });
});

app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);

async function startServer() {
  await initializeDataStore();

  app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi`);
  });
}

startServer();
