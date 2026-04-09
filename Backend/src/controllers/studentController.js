const adminData = require("../config/adminData");

function normalizeStudentId(value) {
  return Number(value);
}

exports.getDashboard = (req, res) => {
  const studentId = normalizeStudentId(req.params.studentId);
  const data = adminData.getStudentDashboardData(studentId);

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Talaba topilmadi"
    });
  }

  return res.status(200).json({
    success: true,
    data
  });
};

exports.getTestSession = (req, res) => {
  const studentId = normalizeStudentId(req.query.studentId);
  const testId = normalizeStudentId(req.params.testId);
  const payload = adminData.getStudentTestSession(studentId, testId);

  if (!payload) {
    return res.status(404).json({
      success: false,
      message: "Test yoki talaba topilmadi"
    });
  }

  if (payload.unavailable) {
    return res.status(400).json({
      success: false,
      message: "Bu testni hozir boshlab bo'lmaydi"
    });
  }

  return res.status(200).json({
    success: true,
    data: payload
  });
};

exports.submitTest = (req, res) => {
  const studentId = normalizeStudentId(req.body.studentId);
  const testId = normalizeStudentId(req.params.testId);
  const startedAt = String(req.body.startedAt || "");
  const answers = req.body.answers || {};
  const payload = adminData.submitStudentTest(studentId, testId, answers, startedAt);

  if (!payload) {
    return res.status(404).json({
      success: false,
      message: "Test yoki talaba topilmadi"
    });
  }

  if (payload.unavailable) {
    return res.status(400).json({
      success: false,
      message: "Bu testni hozir topshirib bo'lmaydi"
    });
  }

  return res.status(200).json({
    success: true,
    data: payload
  });
};
