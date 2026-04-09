const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const studentRoutes = require("./src/routes/studentRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const BODY_LIMIT = "25mb";

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
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

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
});
