const adminData = require("../config/adminData");

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizePhone(value) {
  const digits = normalizeString(value).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const normalizedDigits = digits.startsWith("998") ? digits : `998${digits}`;

  return `+${normalizedDigits.slice(0, 12)}`;
}

function normalizeStudentIds(values) {
  return Array.isArray(values)
    ? values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
    : [];
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || !questions.length) {
    return "Kamida bitta savol qo'shing";
  }

  for (const question of questions) {
    const prompt = normalizeString(question.prompt);
    const options = Array.isArray(question.options) ? question.options : [];
    const correctOptionId = normalizeString(question.correctOptionId);

    if (!prompt) {
      return "Har bir savol uchun matn kiriting";
    }

    if (options.length < 2) {
      return "Har bir savolda kamida 2 ta variant bo'lishi kerak";
    }

    if (options.length > 20) {
      return "Har bir savolda ko'pi bilan 20 ta variant bo'lishi mumkin";
    }

    const hasEmptyOption = options.some((option) => !normalizeString(option.text));

    if (hasEmptyOption) {
      return "Savol variantlarining barchasini to'ldiring";
    }

    const validCorrectOption = options.some((option) => option.id === correctOptionId);

    if (!validCorrectOption) {
      return "Har bir savol uchun to'g'ri javobni belgilang";
    }
  }

  return null;
}

exports.getDashboard = (_req, res) => {
  return res.status(200).json({
    success: true,
    data: adminData.getTeacherDashboardData()
  });
};

exports.createGroup = (req, res) => {
  const name = normalizeString(req.body.name);
  const schedule = normalizeString(req.body.schedule);
  const room = normalizeString(req.body.room);
  const studentIds = normalizeStudentIds(req.body.studentIds);

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Guruh nomini kiriting"
    });
  }

  adminData.createGroup({
    name,
    schedule,
    room,
    studentIds
  });

  return res.status(201).json({
    success: true,
    message: "Yangi guruh yaratildi",
    data: adminData.getTeacherDashboardData()
  });
};

exports.updateGroup = (req, res) => {
  const groupId = Number(req.params.groupId);
  const name = normalizeString(req.body.name);
  const schedule = normalizeString(req.body.schedule);
  const room = normalizeString(req.body.room);
  const studentIds = normalizeStudentIds(req.body.studentIds);

  if (!groupId || !adminData.findGroup(groupId)) {
    return res.status(404).json({
      success: false,
      message: "Tanlangan guruh topilmadi"
    });
  }

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Guruh nomini kiriting"
    });
  }

  adminData.updateGroup(groupId, {
    name,
    schedule,
    room,
    studentIds
  });

  return res.status(200).json({
    success: true,
    message: "Guruh yangilandi",
    data: adminData.getTeacherDashboardData()
  });
};

exports.deleteGroup = (req, res) => {
  const groupId = Number(req.params.groupId);

  if (!groupId || !adminData.findGroup(groupId)) {
    return res.status(404).json({
      success: false,
      message: "Tanlangan guruh topilmadi"
    });
  }

  adminData.deleteGroup(groupId);

  return res.status(200).json({
    success: true,
    message: "Guruh o'chirildi",
    data: adminData.getTeacherDashboardData()
  });
};

exports.createStudent = (req, res) => {
  const name = normalizeString(req.body.name);
  const phone = normalizePhone(req.body.phone);
  const password = normalizeString(req.body.password);
  const rawGroupId = req.body.groupId;
  const groupId = rawGroupId ? Number(rawGroupId) : null;

  if (!name || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "Talaba uchun ism, telefon va parolni kiriting"
    });
  }

  if (groupId && !adminData.findGroup(groupId)) {
    return res.status(404).json({
      success: false,
      message: "Tanlangan guruh topilmadi"
    });
  }

  if (password.length < 4) {
    return res.status(400).json({
      success: false,
      message: "Talaba paroli kamida 4 ta belgidan iborat bo'lishi kerak"
    });
  }

  if (adminData.isPhoneTaken(phone)) {
    return res.status(400).json({
      success: false,
      message: "Bu telefon raqam tizimda allaqachon mavjud"
    });
  }

  adminData.createStudent({
    groupId,
    name,
    phone,
    password
  });

  return res.status(201).json({
    success: true,
    message: "Talaba muvaffaqiyatli qo'shildi",
    data: adminData.getTeacherDashboardData()
  });
};

exports.updateStudent = (req, res) => {
  const studentId = Number(req.params.studentId);
  const name = normalizeString(req.body.name);
  const phone = normalizePhone(req.body.phone);
  const password = normalizeString(req.body.password);
  const rawGroupId = req.body.groupId;
  const groupId = rawGroupId ? Number(rawGroupId) : null;

  if (!studentId || !adminData.findStudent(studentId)) {
    return res.status(404).json({
      success: false,
      message: "Tanlangan talaba topilmadi"
    });
  }

  if (!name || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "Talaba uchun ism, telefon va parolni kiriting"
    });
  }

  if (groupId && !adminData.findGroup(groupId)) {
    return res.status(404).json({
      success: false,
      message: "Tanlangan guruh topilmadi"
    });
  }

  if (password.length < 4) {
    return res.status(400).json({
      success: false,
      message: "Talaba paroli kamida 4 ta belgidan iborat bo'lishi kerak"
    });
  }

  if (adminData.isPhoneTaken(phone, studentId)) {
    return res.status(400).json({
      success: false,
      message: "Bu telefon raqam tizimda allaqachon mavjud"
    });
  }

  adminData.updateStudent(studentId, {
    groupId,
    name,
    phone,
    password
  });

  return res.status(200).json({
    success: true,
    message: "Talaba yangilandi",
    data: adminData.getTeacherDashboardData()
  });
};

exports.deleteStudent = (req, res) => {
  const studentId = Number(req.params.studentId);

  if (!studentId || !adminData.findStudent(studentId)) {
    return res.status(404).json({
      success: false,
      message: "Tanlangan talaba topilmadi"
    });
  }

  adminData.deleteStudent(studentId);

  return res.status(200).json({
    success: true,
    message: "Talaba o'chirildi",
    data: adminData.getTeacherDashboardData()
  });
};

exports.createTest = (req, res) => {
  const title = normalizeString(req.body.title);
  const description = normalizeString(req.body.description);
  const groupId = Number(req.body.groupId);
  const durationMinutes = Number(req.body.durationMinutes);
  const startTime = normalizeString(req.body.startTime);
  const endTime = normalizeString(req.body.endTime);
  const questions = Array.isArray(req.body.questions)
    ? req.body.questions.map((question) => ({
        prompt: normalizeString(question.prompt),
        image: normalizeString(question.image),
        options: Array.isArray(question.options)
          ? question.options.map((option) => ({
              id: normalizeString(option.id),
              text: normalizeString(option.text)
            }))
          : [],
        correctOptionId: normalizeString(question.correctOptionId)
      }))
    : [];

  if (!title || !groupId || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: "Test yaratish uchun barcha majburiy maydonlarni to'ldiring"
    });
  }

  if (!adminData.findGroup(groupId)) {
    return res.status(404).json({
      success: false,
      message: "Tanlangan guruh topilmadi"
    });
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return res.status(400).json({
      success: false,
      message: "Test davomiyligi musbat son bo'lishi kerak"
    });
  }

  const startMillis = new Date(startTime).getTime();
  const endMillis = new Date(endTime).getTime();

  if (!Number.isFinite(startMillis) || !Number.isFinite(endMillis) || endMillis <= startMillis) {
    return res.status(400).json({
      success: false,
      message: "Boshlanish va tugash vaqtlari to'g'ri kiritilishi kerak"
    });
  }

  const availableMinutes = Math.floor((endMillis - startMillis) / 60000);

  if (durationMinutes > availableMinutes) {
    return res.status(400).json({
      success: false,
      message: "Test davomiyligi boshlanish va tugash oralig'idan katta bo'lmasligi kerak"
    });
  }

  const questionError = validateQuestions(questions);

  if (questionError) {
    return res.status(400).json({
      success: false,
      message: questionError
    });
  }

  adminData.createTest({
    title,
    description,
    groupId,
    durationMinutes,
    startTime,
    endTime,
    questions
  });

  return res.status(201).json({
    success: true,
    message: "Test muvaffaqiyatli yaratildi",
    data: adminData.getTeacherDashboardData()
  });
};
