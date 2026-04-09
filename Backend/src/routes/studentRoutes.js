const express = require("express");
const {
  getDashboard,
  getTestSession,
  submitTest
} = require("../controllers/studentController");

const router = express.Router();

router.get("/dashboard/:studentId", getDashboard);
router.get("/tests/:testId", getTestSession);
router.post("/tests/:testId/submit", submitTest);

module.exports = router;
