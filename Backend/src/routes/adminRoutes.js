const express = require("express");
const {
  getDashboard,
  createTest,
  createGroup,
  updateGroup,
  deleteGroup,
  createStudent,
  updateStudent,
  deleteStudent
} = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", getDashboard);
router.post("/tests", createTest);
router.post("/groups", createGroup);
router.patch("/groups/:groupId", updateGroup);
router.delete("/groups/:groupId", deleteGroup);
router.post("/students", createStudent);
router.patch("/students/:studentId", updateStudent);
router.delete("/students/:studentId", deleteStudent);

module.exports = router;
