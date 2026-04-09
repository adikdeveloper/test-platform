import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TEACHER_NAME = "Aymyratov Aydos";
const TEST_WARNING_STORAGE_KEY = "aydos-test-warning-hidden";

function IconBase({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {children}
    </svg>
  );
}

function UserIcon() {
  return (
    <IconBase>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </IconBase>
  );
}

function TeacherIcon() {
  return (
    <IconBase>
      <path d="M3 8.5 12 4l9 4.5-9 4.5L3 8.5Z" />
      <path d="M7 10.5V15c0 1.9 2.2 3.5 5 3.5s5-1.6 5-3.5v-4.5" />
      <path d="M21 9v5" />
    </IconBase>
  );
}

function TestIcon() {
  return (
    <IconBase>
      <path d="M8 3.5h8" />
      <path d="M9 3.5v2a3 3 0 0 1-1.3 2.5l-1 .7A4 4 0 0 0 5 12v4a4.5 4.5 0 0 0 4.5 4.5h5A4.5 4.5 0 0 0 19 16v-4a4 4 0 0 0-1.7-3.3l-1-.7A3 3 0 0 1 15 5.5v-2" />
      <path d="M9 14h6" />
    </IconBase>
  );
}

function TimeIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3 2" />
    </IconBase>
  );
}

function ScoreIcon() {
  return (
    <IconBase>
      <path d="M7 19.5h10" />
      <path d="M8.5 16.5 10 8.5h4l1.5 8" />
      <path d="M9.5 12h5" />
      <path d="M12 4.5v1.5" />
    </IconBase>
  );
}

function QuestionsIcon() {
  return (
    <IconBase>
      <path d="M7 6.5h10" />
      <path d="M7 12h6" />
      <path d="M7 17.5h8" />
      <path d="M17.5 11a2.5 2.5 0 1 1 2.2 3.7v1" />
      <circle cx="19.7" cy="19" r=".7" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function PlayIcon() {
  return (
    <IconBase>
      <path d="m9 7 8 5-8 5Z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function CheckIcon() {
  return (
    <IconBase>
      <path d="m7.5 12 3 3 6-6" />
      <circle cx="12" cy="12" r="9" />
    </IconBase>
  );
}

function SummaryItem({ icon, label, value, wide = false }) {
  return (
    <article className={`student-summary-item${wide ? " student-summary-item--wide" : ""}`}>
      <span className="student-summary-item__icon">{icon}</span>
      <div className="student-summary-item__body">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
}

function getStoredWarningPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(TEST_WARNING_STORAGE_KEY) === "1";
}

function statusLabel(status) {
  if (status === "available") {
    return "Boshlash mumkin";
  }

  if (status === "upcoming") {
    return "Hali ochilmagan";
  }

  if (status === "completed") {
    return "Topshirilgan";
  }

  return "Yakunlangan";
}

function StudentDashboard({ user, dashboard, error, isLoading, onRefresh, onLogout }) {
  const student = dashboard?.student || user;
  const tests = dashboard?.tests || [];
  const [activeTest, setActiveTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [isWrongAnswersOpen, setIsWrongAnswersOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [dontShowWarningAgain, setDontShowWarningAgain] = useState(false);
  const [skipTestWarning, setSkipTestWarning] = useState(getStoredWarningPreference);
  const [sessionError, setSessionError] = useState("");
  const [loadingTestId, setLoadingTestId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAutoSubmittedRef = useRef(false);

  const selectedTest = useMemo(
    () => tests.find((test) => test.status === "available") || null,
    [tests]
  );

  useEffect(() => {
    hasAutoSubmittedRef.current = false;
  }, [activeTest?.id]);

  useEffect(() => {
    if (!activeTest || isSubmitting) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setTimeLeftSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [activeTest, isSubmitting]);

  useEffect(() => {
    if (!activeTest || isSubmitting || timeLeftSeconds !== 0) {
      return;
    }

    void submitActiveTest();
  }, [activeTest, isSubmitting, timeLeftSeconds]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const html = document.documentElement;
    const handleContextMenu = (event) => event.preventDefault();
    const handleSelection = (event) => event.preventDefault();
    const handleCopy = (event) => event.preventDefault();
    const handleKeyDown = async (event) => {
      const key = String(event.key || "").toLowerCase();
      const blockedWithCtrl =
        (event.ctrlKey || event.metaKey) &&
        ["a", "c", "i", "j", "p", "s", "u", "x"].includes(key);
      const blockedWithShift =
        (event.ctrlKey || event.metaKey) && event.shiftKey && ["c", "i", "j"].includes(key);
      const blockedKey = key === "f12" || key === "printscreen";

      if (!blockedWithCtrl && !blockedWithShift && !blockedKey) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (key === "printscreen" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText("");
        } catch {
          // Ignore clipboard permission failures.
        }
      }
    };

    html.classList.add("student-secure-mode");
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelection);
    document.addEventListener("dragstart", handleSelection);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      html.classList.remove("student-secure-mode");
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelection);
      document.removeEventListener("dragstart", handleSelection);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!activeTest || isSubmitting) {
      return undefined;
    }

    const finalizeOnExit = () => {
      if (!activeTest || isSubmitting || hasAutoSubmittedRef.current) {
        return;
      }

      hasAutoSubmittedRef.current = true;
      const payload = JSON.stringify({
        studentId: user.id,
        startedAt: activeTest.startedAt,
        answers
      });

      void fetch(`${API_URL}/student/tests/${activeTest.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: payload,
        keepalive: true
      }).catch(() => {
        hasAutoSubmittedRef.current = false;
      });

      setActiveTest(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeLeftSeconds(0);
      setSessionError("Test yakunlandi");
      onRefresh?.();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        finalizeOnExit();
      }
    };

    window.addEventListener("pagehide", finalizeOnExit);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", finalizeOnExit);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTest, answers, isSubmitting, onRefresh, user.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TEST_WARNING_STORAGE_KEY, skipTestWarning ? "1" : "0");
  }, [skipTestWarning]);

  function handleStartClick() {
    if (skipTestWarning) {
      void startAssignedTest();
      return;
    }

    setDontShowWarningAgain(false);
    setIsWarningOpen(true);
  }

  function confirmStartWithWarning() {
    if (dontShowWarningAgain) {
      setSkipTestWarning(true);
    }

    setIsWarningOpen(false);
    void startAssignedTest();
  }

  async function startAssignedTest() {
    if (!selectedTest) {
      return;
    }

    const testId = selectedTest.id;
    setLoadingTestId(testId);
    setSessionError("");
    setResultData(null);
    setIsWrongAnswersOpen(false);

    try {
      const response = await fetch(`${API_URL}/student/tests/${testId}?studentId=${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Testni yuklab bo'lmadi");
      }

      if (data.data.alreadyCompleted) {
        setResultData(data.data.result);
        return;
      }

      if (data.data.unavailable) {
        setSessionError(statusLabel(data.data.status));
        return;
      }

      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeLeftSeconds(data.data.test.allowedTimeSeconds);
      setActiveTest(data.data.test);
    } catch (requestError) {
      setSessionError(requestError.message || "Testni ochib bo'lmadi");
    } finally {
      setLoadingTestId(null);
    }
  }

  async function submitActiveTest() {
    if (!activeTest || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSessionError("");

    try {
      const response = await fetch(`${API_URL}/student/tests/${activeTest.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentId: user.id,
          startedAt: activeTest.startedAt,
          answers
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Natijani saqlab bo'lmadi");
      }

      setResultData(data.data.result);
      setIsWrongAnswersOpen(false);
      setActiveTest(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeLeftSeconds(0);
      onRefresh?.();
    } catch (requestError) {
      setSessionError(requestError.message || "Test yuborilmadi");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (activeTest) {
    const currentQuestion = activeTest.questions[currentQuestionIndex];

    function handleAnswerSelect(questionId, optionId) {
      setAnswers((current) => ({
        ...current,
        [String(questionId)]: optionId
      }));

      if (currentQuestionIndex < activeTest.questions.length - 1) {
        setCurrentQuestionIndex((current) => current + 1);
      }
    }

    return (
      <section className="dashboard-shell student-shell student-shell--active">
        <article className="panel-card student-session">
          <div className="student-session-topbar">
            <div className="student-question-nav" aria-label="Savollar">
              {activeTest.questions.map((question, index) => {
                const isAnswered = Boolean(answers[String(question.id)]);
                const isCurrent = index === currentQuestionIndex;

                return (
                  <button
                    className={`student-question-nav__item${
                      isCurrent ? " is-current" : ""
                    }${isAnswered ? " is-answered" : ""}`}
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <span className="timer-pill">
              <TimeIcon />
              {formatTime(timeLeftSeconds)}
            </span>
          </div>

          {sessionError ? <p className="banner error">{sessionError}</p> : null}

          {currentQuestion ? (
            <article className="question-editor student-question-card">
              <div className="question-editor__head">
                <strong>{currentQuestion.order}-savol</strong>
              </div>
              <p className="student-question-card__prompt">{currentQuestion.prompt}</p>
              {currentQuestion.image ? (
                <div className="student-question-card__image">
                  <img src={currentQuestion.image} alt={`${currentQuestion.order}-savol rasmi`} />
                </div>
              ) : null}
              <div className="student-options">
                {currentQuestion.options.map((option) => (
                  <label className="student-option" key={option.id}>
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      checked={answers[String(currentQuestion.id)] === option.id}
                      onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                    />
                    <span>{option.text}</span>
                  </label>
                ))}
              </div>
            </article>
          ) : null}

          <div className="form-footer">
            <button
              className="primary-button student-submit-button"
              type="button"
              onClick={() => submitActiveTest()}
              disabled={isSubmitting}
            >
              <CheckIcon />
              {isSubmitting ? "Yakunlanmoqda..." : "Yakunlash"}
            </button>
          </div>
        </article>
      </section>
    );
  }

  if (resultData) {
    return (
      <>
        <section className="dashboard-shell student-shell">
          <article className="panel-card student-focus-card student-result-card">
            <p className="student-result-card__label">Natija</p>
            <strong className="student-result-card__score">{resultData.scorePercent}%</strong>

            <div className="student-summary-grid">
              <SummaryItem
                icon={<TestIcon />}
                label="Test"
                value={resultData.testTitle}
                wide
              />
              <SummaryItem
                icon={<ScoreIcon />}
                label="Ball"
                value={`${resultData.score} / ${resultData.totalQuestions}`}
              />
              <SummaryItem
                icon={<QuestionsIcon />}
                label="To'g'ri javob"
                value={resultData.correctCount}
              />
              <SummaryItem
                icon={<TimeIcon />}
                label="Vaqt"
                value={resultData.timeSpentText}
              />
              <SummaryItem
                icon={<QuestionsIcon />}
                label="Xato javob"
                value={resultData.wrongCount}
              />
              <SummaryItem
                icon={<QuestionsIcon />}
                label="Javob berilmagan"
                value={resultData.unansweredCount}
              />
            </div>

            {resultData.wrongQuestions?.length ? (
              <div className="student-result-actions">
                <button
                  className="ghost-button student-result-trigger"
                  type="button"
                  onClick={() => setIsWrongAnswersOpen(true)}
                >
                  Xato javoblarni ko'rish
                </button>
              </div>
            ) : null}

            {resultData.unansweredQuestions?.length ? (
              <section className="student-result-section">
                <h3>Javob berilmagan savollar</h3>
                <div className="result-list student-result-list">
                  {resultData.unansweredQuestions.map((question) => (
                    <article className="result-card" key={`unanswered-${question.questionNumber}`}>
                      <span>{question.questionNumber}-savol</span>
                      <strong>{question.prompt}</strong>
                      <p className="test-copy">Sizning javob: Javob berilmagan</p>
                      <p className="test-copy">To'g'ri javob: {question.correctAnswer}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="student-card-actions">
              <button
                className="primary-button student-start-button"
                type="button"
                onClick={() => {
                  setIsWrongAnswersOpen(false);
                  setResultData(null);
                }}
              >
                <CheckIcon />
                Yopish
              </button>
            </div>
          </article>
        </section>

        {isWrongAnswersOpen ? (
          <div className="student-modal-backdrop" onClick={() => setIsWrongAnswersOpen(false)}>
            <div
              className="student-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Xato javoblar"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="student-modal__head">
                <h3>Xato javoblar</h3>
                <button
                  className="ghost-button student-modal__close"
                  type="button"
                  onClick={() => setIsWrongAnswersOpen(false)}
                >
                  Yopish
                </button>
              </div>

              <div className="result-list student-result-list">
                {resultData.wrongQuestions.map((question) => (
                  <article className="result-card" key={`wrong-${question.questionNumber}`}>
                    <span>{question.questionNumber}-savol</span>
                    <strong>{question.prompt}</strong>
                    <p className="test-copy">Sizning javob: {question.selectedAnswer}</p>
                    <p className="test-copy">To'g'ri javob: {question.correctAnswer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  if (!selectedTest) {
    return (
      <section className="dashboard-shell student-shell">
        <article className="panel-card student-focus-card student-focus-card--empty">
          <p className="student-empty-message">Sizda testlar mavjud emas</p>
          <div className="student-empty-actions">
            <button className="ghost-button student-empty-exit" type="button" onClick={onLogout}>
              Chiqish
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <>
      <section className="dashboard-shell student-shell">
        <article className="panel-card student-focus-card">
          <div className="student-summary-grid">
            <SummaryItem icon={<UserIcon />} label="O'quvchi" value={student.name} wide />
            <SummaryItem icon={<TeacherIcon />} label="O'qituvchi" value={TEACHER_NAME} wide />
            <SummaryItem
              icon={<TestIcon />}
              label="Test"
              value={selectedTest ? selectedTest.title : "Mavjud emas"}
              wide
            />
            <SummaryItem
              icon={<TimeIcon />}
              label="Vaqt"
              value={selectedTest ? `${selectedTest.durationMinutes} daqiqa` : "-"}
            />
            <SummaryItem
              icon={<ScoreIcon />}
              label="Umumiy ball"
              value={selectedTest ? `${selectedTest.questionCount} ball` : "-"}
            />
            <SummaryItem
              icon={<QuestionsIcon />}
              label="Savollar"
              value={selectedTest ? `${selectedTest.questionCount} ta savol` : "-"}
              wide
            />
          </div>

          {error ? <p className="banner error">{error}</p> : null}
          {isLoading ? <p className="banner info">Yuklanmoqda...</p> : null}
          {sessionError ? <p className="banner error">{sessionError}</p> : null}

          <div className="student-card-actions">
            <button
              className="primary-button student-start-button"
              type="button"
              onClick={handleStartClick}
              disabled={loadingTestId === selectedTest.id}
            >
              <PlayIcon />
              {loadingTestId === selectedTest.id ? "Yuklanmoqda..." : "Boshlash"}
            </button>
          </div>
        </article>
      </section>

      {isWarningOpen ? (
        <div className="student-modal-backdrop" onClick={() => setIsWarningOpen(false)}>
          <div
            className="student-modal student-warning-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Test ogohlantirishi"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="student-modal__head">
              <h3>Ogohlantirish</h3>
              <button
                className="ghost-button student-modal__close"
                type="button"
                onClick={() => setIsWarningOpen(false)}
              >
                Yopish
              </button>
            </div>

            <div className="student-warning-list">
              <p>Matn nusxalash va sichqonchaning o'ng tugmasi bloklanadi.</p>
              <p>`Ctrl+Shift+I`, `F12`, `Ctrl+C` kabi tugmalar ishlamaydi.</p>
              <p>Skrinshotga qarshi cheklovlar yoqiladi, lekin brauzerda buni to'liq kafolatlab bo'lmaydi.</p>
              <p>Saytdan chiqsangiz yoki tabni almashtirsangiz test avtomatik yakunlanadi.</p>
              <p>Belgilanmagan savollar javob berilmagan deb hisoblanadi.</p>
            </div>

            <label className="student-warning-check">
              <input
                type="checkbox"
                checked={dontShowWarningAgain}
                onChange={(event) => setDontShowWarningAgain(event.target.checked)}
              />
              <span>Boshqa so'ralmasin</span>
            </label>

            <div className="student-warning-actions">
              <button className="ghost-button" type="button" onClick={() => setIsWarningOpen(false)}>
                Bekor qilish
              </button>
              <button className="primary-button student-start-button" type="button" onClick={confirmStartWithWarning}>
                <PlayIcon />
                Davom etish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default StudentDashboard;
