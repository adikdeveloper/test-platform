const fs = require("fs");
const path = require("path");
const {
  connectDatabase,
  isDatabaseEnabled,
  loadPersistedState,
  savePersistedState
} = require("./database");

const DATA_FILE = path.join(__dirname, "../data/store.json");

const teacher = {
  id: 1,
  name: "Aymurat",
  phone: "+998901234567",
  password: "123456",
  role: "teacher",
  subject: "Asosiy fan"
};

const defaultGroups = [
  {
    id: 1,
    name: "Aydos 101",
    schedule: "Du, Chor, Ju / 10:00",
    room: "Xona 204"
  },
  {
    id: 2,
    name: "Aydos 202",
    schedule: "Se, Pay / 14:30",
    room: "Xona 305"
  }
];

const defaultStudents = [
  {
    id: 101,
    groupId: 1,
    name: "Azizbek Qodirov",
    phone: "+998901112233",
    password: "aziz101"
  },
  {
    id: 102,
    groupId: 1,
    name: "Nilufar Yoqubova",
    phone: "+998909998877",
    password: "nilu101"
  },
  {
    id: 201,
    groupId: 2,
    name: "Jahongir Tursunov",
    phone: "+998933335577",
    password: "jahon202"
  },
  {
    id: 202,
    groupId: 2,
    name: "Sevinch Rashidova",
    phone: "+998998887766",
    password: "sevinch202"
  }
];

const defaultTests = [
  {
    id: 1,
    groupId: 1,
    title: "1-modul nazorat testi",
    description: "Algebra va mantiqiy fikrlash bo'yicha yakuniy mini test.",
    durationMinutes: 30,
    startTime: "2026-04-07T09:00:00.000Z",
    endTime: "2026-04-10T15:00:00.000Z",
    createdAt: "2026-04-07T08:30:00.000Z",
    questions: [
      {
        id: 1001,
        prompt: "2x + 6 = 14 bo'lsa, x nechiga teng?",
        options: [
          { id: "a", text: "3" },
          { id: "b", text: "4" },
          { id: "c", text: "5" },
          { id: "d", text: "6" }
        ],
        correctOptionId: "b"
      },
      {
        id: 1002,
        prompt: "5, 10, 20, 40 ketma-ketligidagi keyingi son qaysi?",
        options: [
          { id: "a", text: "45" },
          { id: "b", text: "60" },
          { id: "c", text: "80" },
          { id: "d", text: "100" }
        ],
        correctOptionId: "c"
      },
      {
        id: 1003,
        prompt: "12 ning 25 foizi nechiga teng?",
        options: [
          { id: "a", text: "2" },
          { id: "b", text: "3" },
          { id: "c", text: "4" },
          { id: "d", text: "6" }
        ],
        correctOptionId: "b"
      }
    ]
  },
  {
    id: 2,
    groupId: 2,
    title: "2-modul kirish testi",
    description: "Yangi mavzu oldidan qisqa diagnostik test.",
    durationMinutes: 25,
    startTime: "2026-04-10T09:00:00.000Z",
    endTime: "2026-04-12T14:00:00.000Z",
    createdAt: "2026-04-08T07:00:00.000Z",
    questions: [
      {
        id: 2001,
        prompt: "3(4 + 2) ifodaning qiymati nechiga teng?",
        options: [
          { id: "a", text: "12" },
          { id: "b", text: "18" },
          { id: "c", text: "24" },
          { id: "d", text: "30" }
        ],
        correctOptionId: "b"
      },
      {
        id: 2002,
        prompt: "49 sonining kvadrat ildizi qaysi?",
        options: [
          { id: "a", text: "5" },
          { id: "b", text: "6" },
          { id: "c", text: "7" },
          { id: "d", text: "8" }
        ],
        correctOptionId: "c"
      }
    ]
  },
  {
    id: 3,
    groupId: 1,
    title: "Demo test",
    description: "Interfeysni tekshirish uchun qisqa demo test.",
    durationMinutes: 20,
    startTime: "2026-04-08T06:00:00.000Z",
    endTime: "2026-04-12T18:00:00.000Z",
    createdAt: "2026-04-09T07:30:00.000Z",
    questions: [
      {
        id: 3001,
        prompt: "9 + 6 nechiga teng?",
        options: [
          { id: "a", text: "13" },
          { id: "b", text: "14" },
          { id: "c", text: "15" },
          { id: "d", text: "16" }
        ],
        correctOptionId: "c"
      },
      {
        id: 3002,
        prompt: "15 sonining yarmi qaysi?",
        options: [
          { id: "a", text: "5" },
          { id: "b", text: "7.5" },
          { id: "c", text: "8" },
          { id: "d", text: "10" }
        ],
        correctOptionId: "b"
      },
      {
        id: 3003,
        prompt: "4 x 5 nechiga teng?",
        options: [
          { id: "a", text: "18" },
          { id: "b", text: "19" },
          { id: "c", text: "20" },
          { id: "d", text: "21" }
        ],
        correctOptionId: "c"
      }
    ]
  },
  {
    id: 4,
    groupId: 2,
    title: "Demo test",
    description: "Talaba panelini tekshirish uchun demo test.",
    durationMinutes: 20,
    startTime: "2026-04-08T06:00:00.000Z",
    endTime: "2026-04-12T18:00:00.000Z",
    createdAt: "2026-04-09T07:35:00.000Z",
    questions: [
      {
        id: 4001,
        prompt: "18 - 7 nechiga teng?",
        options: [
          { id: "a", text: "10" },
          { id: "b", text: "11" },
          { id: "c", text: "12" },
          { id: "d", text: "13" }
        ],
        correctOptionId: "b"
      },
      {
        id: 4002,
        prompt: "6 ning kvadrati qaysi?",
        options: [
          { id: "a", text: "12" },
          { id: "b", text: "24" },
          { id: "c", text: "30" },
          { id: "d", text: "36" }
        ],
        correctOptionId: "d"
      },
      {
        id: 4003,
        prompt: "8 + 3 nechiga teng?",
        options: [
          { id: "a", text: "10" },
          { id: "b", text: "11" },
          { id: "c", text: "12" },
          { id: "d", text: "13" }
        ],
        correctOptionId: "b"
      }
    ]
  }
];

const defaultAttempts = [
  {
    id: 1,
    testId: 1,
    studentId: 102,
    startedAt: "2026-04-08T08:00:00.000Z",
    submittedAt: "2026-04-08T08:18:00.000Z",
    timeSpentSeconds: 1080,
    answers: [
      { questionId: 1001, selectedOptionId: "b" },
      { questionId: 1002, selectedOptionId: "d" },
      { questionId: 1003, selectedOptionId: null }
    ],
    result: {
      totalQuestions: 3,
      correctCount: 1,
      wrongCount: 1,
      unansweredCount: 1,
      score: 1,
      scorePercent: 33,
      wrongQuestions: [
        {
          questionNumber: 2,
          prompt: "5, 10, 20, 40 ketma-ketligidagi keyingi son qaysi?",
          selectedAnswer: "100",
          correctAnswer: "80"
        }
      ],
      unansweredQuestions: [
        {
          questionNumber: 3,
          prompt: "12 ning 25 foizi nechiga teng?",
          correctAnswer: "3"
        }
      ]
    }
  }
];

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

let groups = cloneData(defaultGroups);
let students = cloneData(defaultStudents);
let tests = cloneData(defaultTests);
let attempts = cloneData(defaultAttempts);
let remoteSaveQueue = Promise.resolve();

function getCurrentState() {
  return {
    teacher,
    groups,
    students,
    tests,
    attempts
  };
}

function queueRemoteSave() {
  if (!isDatabaseEnabled()) {
    return;
  }

  remoteSaveQueue = remoteSaveQueue
    .then(() => savePersistedState(getCurrentState()))
    .catch((error) => {
      console.error("MongoDB saqlashda xato:", error.message);
    });
}

function hydrateState(payload) {
  groups = Array.isArray(payload?.groups) ? cloneData(payload.groups) : cloneData(defaultGroups);
  students = Array.isArray(payload?.students)
    ? cloneData(payload.students)
    : cloneData(defaultStudents);
  tests = Array.isArray(payload?.tests) ? cloneData(payload.tests) : cloneData(defaultTests);
  attempts = Array.isArray(payload?.attempts)
    ? cloneData(payload.attempts)
    : cloneData(defaultAttempts);
}

function saveState() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      {
        groups,
        students,
        tests,
        attempts
      },
      null,
      2
    ),
    "utf8"
  );
  queueRemoteSave();
}

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      hydrateState(parsed);
      return;
    }
  } catch {
    // Fall back to seeded data if the persisted store is invalid.
  }

  hydrateState({
    groups: defaultGroups,
    students: defaultStudents,
    tests: defaultTests,
    attempts: defaultAttempts
  });
  saveState();
}

loadState();

async function initializeDataStore() {
  loadState();

  try {
    const connected = await connectDatabase();

    if (!connected) {
      return;
    }

    const remoteState = await loadPersistedState(getCurrentState());
    hydrateState(remoteState);
    console.log("MongoDB Atlas ulandi");
  } catch (error) {
    console.error("MongoDB Atlas ulanmadi, local store ishlatiladi:", error.message);
  }
}

function getNextId(items) {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
}

function findGroup(groupId) {
  return groups.find((group) => group.id === Number(groupId));
}

function findStudent(studentId) {
  return students.find((student) => student.id === Number(studentId));
}

function findTest(testId) {
  return tests.find((test) => test.id === Number(testId));
}

function findAttempt(testId, studentId) {
  return attempts.find(
    (attempt) => attempt.testId === Number(testId) && attempt.studentId === Number(studentId)
  );
}

function getGroupStudents(groupId) {
  return students.filter((student) => student.groupId === Number(groupId));
}

function getGroupName(groupId) {
  if (!groupId) {
    return "Biriktirilmagan";
  }

  const group = findGroup(groupId);
  return group ? group.name : "Noma'lum guruh";
}

function serializeStudent(student) {
  return {
    id: student.id,
    name: student.name,
    phone: student.phone,
    password: student.password,
    groupId: student.groupId || null
  };
}

function normalizeStudentIds(studentIds) {
  return Array.from(
    new Set(
      (Array.isArray(studentIds) ? studentIds : [])
        .map((studentId) => Number(studentId))
        .filter((studentId) => Number.isFinite(studentId) && studentId > 0)
    )
  );
}

function getUnassignedStudents() {
  return students.filter((student) => !findGroup(student.groupId)).map(serializeStudent);
}

function getOptionText(question, optionId) {
  const option = question.options.find((item) => item.id === optionId);
  return option ? option.text : "Tanlanmagan";
}

function formatTimeSpent(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  return `${minutes} daqiqa ${restSeconds} soniya`;
}

function getTeacherUser() {
  return {
    id: teacher.id,
    name: teacher.name,
    phone: teacher.phone,
    role: teacher.role
  };
}

function getStudentUser(student) {
  return {
    id: student.id,
    name: student.name,
    phone: student.phone,
    role: "student",
    groupId: student.groupId,
    groupName: getGroupName(student.groupId)
  };
}

function findUserByCredentials(phone, password) {
  if (phone === teacher.phone && password === teacher.password) {
    return getTeacherUser();
  }

  const student = students.find(
    (item) => item.phone === phone && String(item.password) === String(password)
  );

  return student ? getStudentUser(student) : null;
}

function getLifecycleStatus(test) {
  const now = Date.now();
  const start = new Date(test.startTime).getTime();
  const end = new Date(test.endTime).getTime();

  if (now < start) {
    return "upcoming";
  }

  if (now > end) {
    return "closed";
  }

  return "active";
}

function isDemoTest(test) {
  return Boolean(test?.isDemo) || String(test?.title || "").trim().toLowerCase() === "demo test";
}

function getStudentTestStatus(test, studentId) {
  if (findAttempt(test.id, studentId)) {
    return "completed";
  }

  return getLifecycleStatus(test) === "active" ? "available" : getLifecycleStatus(test);
}

function formatResultSummary(attempt) {
  return {
    score: attempt.result.score,
    totalQuestions: attempt.result.totalQuestions,
    scorePercent: attempt.result.scorePercent,
    correctCount: attempt.result.correctCount,
    wrongCount: attempt.result.wrongCount,
    unansweredCount: attempt.result.unansweredCount,
    submittedAt: attempt.submittedAt,
    timeSpentSeconds: attempt.timeSpentSeconds,
    timeSpentText: formatTimeSpent(attempt.timeSpentSeconds)
  };
}

function getTeacherSummary() {
  return {
    groupCount: groups.length,
    studentCount: students.length,
    testCount: tests.length,
    attemptCount: attempts.length
  };
}

function getTeacherGroups() {
  return groups.map((group) => ({
    ...group,
    students: getGroupStudents(group.id).map(serializeStudent)
  }));
}

function getTeacherTests() {
  return tests
    .map((test) => {
      const testAttempts = attempts.filter((attempt) => attempt.testId === test.id);
      const averageScore = testAttempts.length
        ? Math.round(
            testAttempts.reduce((total, attempt) => total + attempt.result.scorePercent, 0) /
              testAttempts.length
          )
        : 0;

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        groupId: test.groupId,
        groupName: getGroupName(test.groupId),
        questionCount: test.questions.length,
        durationMinutes: test.durationMinutes,
        startTime: test.startTime,
        endTime: test.endTime,
        createdAt: test.createdAt,
        status: getLifecycleStatus(test),
        attemptCount: testAttempts.length,
        averageScore
      };
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function getTeacherResults() {
  return attempts
    .map((attempt) => {
      const student = findStudent(attempt.studentId);
      const test = findTest(attempt.testId);

      return {
        id: attempt.id,
        studentId: student ? student.id : null,
        studentName: student ? student.name : "Noma'lum talaba",
        groupId: student ? student.groupId || null : null,
        groupName: student ? getGroupName(student.groupId) : "Noma'lum guruh",
        testId: test ? test.id : null,
        testTitle: test ? test.title : "Noma'lum test",
        score: attempt.result.score,
        totalQuestions: attempt.result.totalQuestions,
        scorePercent: attempt.result.scorePercent,
        correctCount: attempt.result.correctCount,
        wrongCount: attempt.result.wrongCount,
        unansweredCount: attempt.result.unansweredCount,
        timeSpentText: formatTimeSpent(attempt.timeSpentSeconds),
        submittedAt: attempt.submittedAt
      };
    })
    .sort(
      (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
    );
}

function getTeacherDashboardData() {
  return {
    teacher: getTeacherUser(),
    summary: getTeacherSummary(),
    groups: getTeacherGroups(),
    unassignedStudents: getUnassignedStudents(),
    tests: getTeacherTests(),
    recentResults: getTeacherResults()
  };
}

function getStudentDashboardData(studentId) {
  const student = findStudent(studentId);

  if (!student) {
    return null;
  }

  const studentTests = tests
    .filter((test) => test.groupId === student.groupId && !isDemoTest(test))
    .map((test) => {
      const attempt = findAttempt(test.id, student.id);

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        groupName: getGroupName(test.groupId),
        questionCount: test.questions.length,
        durationMinutes: test.durationMinutes,
        startTime: test.startTime,
        endTime: test.endTime,
        status: getStudentTestStatus(test, student.id),
        resultSummary: attempt ? formatResultSummary(attempt) : null
      };
    })
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());

  return {
    teacher: {
      name: teacher.name
    },
    student: getStudentUser(student),
    summary: {
      availableTestCount: studentTests.filter((test) => test.status === "available").length,
      upcomingTestCount: studentTests.filter((test) => test.status === "upcoming").length,
      completedTestCount: studentTests.filter((test) => test.status === "completed").length
    },
    tests: studentTests
  };
}

function getAllowedTimeSeconds(test, startedAt) {
  const startMillis = new Date(startedAt).getTime();
  const endMillis = new Date(test.endTime).getTime();
  const configuredSeconds = test.durationMinutes * 60;

  if (!Number.isFinite(startMillis)) {
    return configuredSeconds;
  }

  return Math.max(0, Math.min(configuredSeconds, Math.floor((endMillis - startMillis) / 1000)));
}

function getStudentTestSession(studentId, testId) {
  const student = findStudent(studentId);
  const test = findTest(testId);

  if (!student || !test || test.groupId !== student.groupId || isDemoTest(test)) {
    return null;
  }

  const attempt = findAttempt(test.id, student.id);

  if (attempt) {
    return {
      alreadyCompleted: true,
      result: getAttemptResult(attempt.id)
    };
  }

  if (getStudentTestStatus(test, student.id) !== "available") {
    return {
      unavailable: true,
      status: getStudentTestStatus(test, student.id)
    };
  }

  const startedAt = new Date().toISOString();

  return {
    alreadyCompleted: false,
    test: {
      id: test.id,
      title: test.title,
      description: test.description,
      groupName: getGroupName(test.groupId),
      questionCount: test.questions.length,
      durationMinutes: test.durationMinutes,
      startTime: test.startTime,
      endTime: test.endTime,
      startedAt,
      allowedTimeSeconds: getAllowedTimeSeconds(test, startedAt),
      questions: test.questions.map((question, index) => ({
        id: question.id,
        order: index + 1,
        prompt: question.prompt,
        image: question.image || "",
        options: question.options
      }))
    }
  };
}

function calculateAttemptResult(test, answers) {
  const answerMap = answers || {};
  const wrongQuestions = [];
  const unansweredQuestions = [];
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  test.questions.forEach((question, index) => {
    const selectedOptionId = answerMap[String(question.id)] || null;

    if (!selectedOptionId) {
      unansweredCount += 1;
      unansweredQuestions.push({
        questionNumber: index + 1,
        prompt: question.prompt,
        correctAnswer: getOptionText(question, question.correctOptionId)
      });
      return;
    }

    if (selectedOptionId === question.correctOptionId) {
      correctCount += 1;
      return;
    }

    wrongCount += 1;
    wrongQuestions.push({
      questionNumber: index + 1,
      prompt: question.prompt,
      selectedAnswer: getOptionText(question, selectedOptionId),
      correctAnswer: getOptionText(question, question.correctOptionId)
    });
  });

  const totalQuestions = test.questions.length;
  const scorePercent = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    correctCount,
    wrongCount,
    unansweredCount,
    score: correctCount,
    scorePercent,
    wrongQuestions,
    unansweredQuestions
  };
}

function submitStudentTest(studentId, testId, answers, startedAt) {
  const student = findStudent(studentId);
  const test = findTest(testId);

  if (!student || !test || test.groupId !== student.groupId || isDemoTest(test)) {
    return null;
  }

  const existingAttempt = findAttempt(test.id, student.id);

  if (existingAttempt) {
    return {
      alreadyCompleted: true,
      result: getAttemptResult(existingAttempt.id)
    };
  }

  if (getStudentTestStatus(test, student.id) !== "available") {
    return {
      unavailable: true
    };
  }

  const submittedAt = new Date().toISOString();
  const rawSpentSeconds = Math.floor(
    (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );
  const allowedTimeSeconds = getAllowedTimeSeconds(test, startedAt);
  const timeSpentSeconds = Math.max(
    0,
    Math.min(Number.isFinite(rawSpentSeconds) ? rawSpentSeconds : 0, allowedTimeSeconds)
  );
  const normalizedAnswers = Object.entries(answers || {}).map(([questionId, selectedOptionId]) => ({
    questionId: Number(questionId),
    selectedOptionId: selectedOptionId || null
  }));
  const result = calculateAttemptResult(test, answers);

  const attempt = {
    id: getNextId(attempts),
    testId: test.id,
    studentId: student.id,
    startedAt,
    submittedAt,
    timeSpentSeconds,
    answers: normalizedAnswers,
    result
  };

  attempts.push(attempt);
  saveState();

  return {
    alreadyCompleted: false,
    result: getAttemptResult(attempt.id)
  };
}

function getAttemptResult(attemptId) {
  const attempt = attempts.find((item) => item.id === Number(attemptId));

  if (!attempt) {
    return null;
  }

  const test = findTest(attempt.testId);

  return {
    testTitle: test ? test.title : "Noma'lum test",
    groupName: test ? getGroupName(test.groupId) : "Noma'lum guruh",
    totalQuestions: attempt.result.totalQuestions,
    correctCount: attempt.result.correctCount,
    wrongCount: attempt.result.wrongCount,
    unansweredCount: attempt.result.unansweredCount,
    score: attempt.result.score,
    scorePercent: attempt.result.scorePercent,
    wrongQuestions: attempt.result.wrongQuestions,
    unansweredQuestions: attempt.result.unansweredQuestions,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    timeSpentSeconds: attempt.timeSpentSeconds,
    timeSpentText: formatTimeSpent(attempt.timeSpentSeconds)
  };
}

function syncGroupStudents(groupId, studentIds) {
  const normalizedGroupId = Number(groupId);
  const targetStudentIds = new Set(normalizeStudentIds(studentIds));

  students.forEach((student) => {
    if (student.groupId === normalizedGroupId && !targetStudentIds.has(student.id)) {
      student.groupId = null;
      return;
    }

    if (!targetStudentIds.has(student.id)) {
      return;
    }

    if (!findGroup(student.groupId) || student.groupId === normalizedGroupId) {
      student.groupId = normalizedGroupId;
    }
  });
}

function createGroup(payload) {
  const group = {
    id: getNextId(groups),
    name: payload.name,
    schedule: payload.schedule || "Belgilanmagan",
    room: payload.room || "Belgilanmagan"
  };

  groups.push(group);
  syncGroupStudents(group.id, payload.studentIds);
  saveState();

  return group;
}

function updateGroup(groupId, payload) {
  const group = findGroup(groupId);

  if (!group) {
    return null;
  }

  group.name = payload.name;
  group.schedule = payload.schedule || "Belgilanmagan";
  group.room = payload.room || "Belgilanmagan";
  syncGroupStudents(group.id, payload.studentIds);
  saveState();

  return group;
}

function deleteGroup(groupId) {
  const normalizedGroupId = Number(groupId);
  const groupIndex = groups.findIndex((group) => group.id === normalizedGroupId);

  if (groupIndex === -1) {
    return null;
  }

  const [removedGroup] = groups.splice(groupIndex, 1);
  const removedStudentIds = students
    .filter((student) => student.groupId === normalizedGroupId)
    .map((student) => student.id);

  for (let index = students.length - 1; index >= 0; index -= 1) {
    if (students[index].groupId === normalizedGroupId) {
      students.splice(index, 1);
    }
  }

  const removedTestIds = tests
    .filter((test) => test.groupId === normalizedGroupId)
    .map((test) => test.id);

  for (let index = tests.length - 1; index >= 0; index -= 1) {
    if (tests[index].groupId === normalizedGroupId) {
      tests.splice(index, 1);
    }
  }

  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    if (
      removedTestIds.includes(attempts[index].testId) ||
      removedStudentIds.includes(attempts[index].studentId)
    ) {
      attempts.splice(index, 1);
    }
  }

  saveState();

  return removedGroup;
}

function isPhoneTaken(phone, excludeStudentId = null) {
  if (teacher.phone === phone) {
    return true;
  }

  return students.some(
    (student) => student.phone === phone && student.id !== Number(excludeStudentId)
  );
}

function createStudent(payload) {
  const student = {
    id: getNextId(students),
    groupId: payload.groupId || null,
    name: payload.name,
    phone: payload.phone,
    password: payload.password
  };

  students.push(student);
  saveState();

  return student;
}

function updateStudent(studentId, payload) {
  const student = findStudent(studentId);

  if (!student) {
    return null;
  }

  student.groupId = payload.groupId || null;
  student.name = payload.name;
  student.phone = payload.phone;
  student.password = payload.password;
  saveState();

  return student;
}

function deleteStudent(studentId) {
  const normalizedStudentId = Number(studentId);
  const studentIndex = students.findIndex((student) => student.id === normalizedStudentId);

  if (studentIndex === -1) {
    return null;
  }

  const [removedStudent] = students.splice(studentIndex, 1);

  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    if (attempts[index].studentId === normalizedStudentId) {
      attempts.splice(index, 1);
    }
  }

  saveState();

  return removedStudent;
}

function createTest(payload) {
  const testId = getNextId(tests);
  const questionStartId = testId * 1000;

  const test = {
    id: testId,
    groupId: payload.groupId,
    title: payload.title,
    description: payload.description,
    isDemo: false,
    durationMinutes: payload.durationMinutes,
    startTime: payload.startTime,
    endTime: payload.endTime,
    createdAt: new Date().toISOString(),
    questions: payload.questions.map((question, index) => ({
      id: questionStartId + index + 1,
      prompt: question.prompt,
      image: question.image || "",
      options: question.options,
      correctOptionId: question.correctOptionId
    }))
  };

  tests.push(test);
  saveState();

  return test;
}

module.exports = {
  teacher,
  initializeDataStore,
  findGroup,
  findStudent,
  findTest,
  findAttempt,
  findUserByCredentials,
  getTeacherUser,
  getStudentUser,
  getTeacherDashboardData,
  getStudentDashboardData,
  getStudentTestSession,
  submitStudentTest,
  getAttemptResult,
  createGroup,
  updateGroup,
  deleteGroup,
  createStudent,
  updateStudent,
  deleteStudent,
  createTest,
  isPhoneTaken
};
