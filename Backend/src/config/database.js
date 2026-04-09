const mongoose = require("mongoose");

const STATE_KEY = "main";

const stateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true
    },
    teacher: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    groups: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    students: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    tests: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    attempts: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    }
  },
  {
    versionKey: false,
    minimize: false
  }
);

const AppState = mongoose.models.AppState || mongoose.model("AppState", stateSchema);

async function connectDatabase() {
  const uri = String(process.env.MONGODB_URI || "").trim();

  if (!uri) {
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });

  return true;
}

function isDatabaseEnabled() {
  return mongoose.connection.readyState === 1;
}

async function loadPersistedState(fallbackState) {
  if (!isDatabaseEnabled()) {
    return fallbackState;
  }

  const existingState = await AppState.findOne({ key: STATE_KEY }).lean();

  if (existingState) {
    return {
      teacher: existingState.teacher || fallbackState.teacher,
      groups: existingState.groups || fallbackState.groups,
      students: existingState.students || fallbackState.students,
      tests: existingState.tests || fallbackState.tests,
      attempts: existingState.attempts || fallbackState.attempts
    };
  }

  await AppState.create({
    key: STATE_KEY,
    teacher: fallbackState.teacher,
    groups: fallbackState.groups,
    students: fallbackState.students,
    tests: fallbackState.tests,
    attempts: fallbackState.attempts
  });

  return fallbackState;
}

async function savePersistedState(state) {
  if (!isDatabaseEnabled()) {
    return;
  }

  await AppState.findOneAndUpdate(
    { key: STATE_KEY },
    {
      key: STATE_KEY,
      teacher: state.teacher,
      groups: state.groups,
      students: state.students,
      tests: state.tests,
      attempts: state.attempts
    },
    {
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
}

module.exports = {
  connectDatabase,
  isDatabaseEnabled,
  loadPersistedState,
  savePersistedState
};
