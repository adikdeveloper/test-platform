const adminData = require("../config/adminData");

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const normalizedDigits = digits.startsWith("998") ? digits : `998${digits}`;

  return `+${normalizedDigits.slice(0, 12)}`;
}

exports.login = (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const password = String(req.body.password || "");

  if (!phone || !password) {
    return res.status(400).json({
      success: false,
      message: "Telefon raqam va parolni kiriting"
    });
  }

  const validPhonePattern = /^\+998\d{9}$/;

  if (!validPhonePattern.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Telefon raqam formati noto'g'ri. Masalan: +998901234567"
    });
  }

  const user = adminData.findUserByCredentials(phone, password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Telefon raqam yoki parol noto'g'ri"
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login muvaffaqiyatli",
    user
  });
};
