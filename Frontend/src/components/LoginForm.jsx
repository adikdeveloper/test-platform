import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const PHONE_PREFIX = "+998-";

function formatPhoneInput(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const localDigits = (digits.startsWith("998") ? digits.slice(3) : digits).slice(0, 9);

  const parts = [
    localDigits.slice(0, 2),
    localDigits.slice(2, 5),
    localDigits.slice(5, 7),
    localDigits.slice(7, 9)
  ].filter(Boolean);

  return `${PHONE_PREFIX}${parts.join("-")}`;
}

async function requestFullscreenMode() {
  if (typeof document === "undefined" || document.fullscreenElement) {
    return;
  }

  const target = document.documentElement;

  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen();
      return;
    }

    if (target.webkitRequestFullscreen) {
      await target.webkitRequestFullscreen();
    }
  } catch {
    // Ignore browser rejections and keep normal layout.
  }
}

function LoginForm({ onLoginSuccess }) {
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login amalga oshmadi");
      }

      setMessage(`Xush kelibsiz, ${data.user.name}`);
      setPhone(PHONE_PREFIX);
      setPassword("");
      void requestFullscreenMode();
      onLoginSuccess(data.user);
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="phone">Telefon raqam</label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          placeholder="+998-90-123-45-67"
          value={phone}
          onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
          maxLength={17}
          required
        />
      </div>

      <div className="field-group">
        <label htmlFor="password">Parol</label>
        <input
          id="password"
          type="password"
          placeholder="Parolni kiriting"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Kirilmoqda..." : "Kirish"}
      </button>

      {message ? (
        <p className={isError ? "status error" : "status success"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

export default LoginForm;
