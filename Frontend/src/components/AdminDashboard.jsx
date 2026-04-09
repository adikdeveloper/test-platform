import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const PHONE_PREFIX = "+998-";
const MAX_TEST_OPTIONS = 20;
const DEFAULT_TEST_OPTION_COUNT = 4;

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

function getOptionId(index) {
  return String.fromCharCode(97 + index);
}

function getOptionLabel(index) {
  return String.fromCharCode(65 + index);
}

function createOption(index) {
  return {
    id: getOptionId(index),
    text: ""
  };
}

function createQuestion() {
  return {
    key: `${Date.now()}-${Math.random()}`,
    prompt: "",
    image: "",
    options: Array.from({ length: DEFAULT_TEST_OPTION_COUNT }, (_, index) => createOption(index)),
    correctOptionId: getOptionId(0)
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Rasmni yuklab bo'lmadi"));
    reader.readAsDataURL(file);
  });
}

const initialGroupForm = {
  name: "",
  schedule: "",
  room: ""
};

const initialStudentForm = {
  groupId: "",
  name: "",
  phone: PHONE_PREFIX,
  password: ""
};

function createInitialTestForm(groupId = "") {
  return {
    title: "",
    groupId,
    description: "",
    durationMinutes: 30,
    startTime: "",
    endTime: "",
    questions: [createQuestion(), createQuestion()]
  };
}

const initialTestForm = createInitialTestForm();

function formatDateTime(value) {
  if (!value) {
    return "Belgilanmagan";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusLabel(status) {
  if (status === "active") {
    return "Faol";
  }

  if (status === "upcoming") {
    return "Kutilmoqda";
  }

  if (status === "closed") {
    return "Yakunlangan";
  }

  return status;
}

function getInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

const ITEMS_PER_PAGE = 25;

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase();
}

function paginateItems(items, currentPage) {
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;

  return {
    items: items.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    totalPages,
    currentPage: safePage
  };
}

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const normalizedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items = [];

  normalizedPages.forEach((page, index) => {
    const previousPage = normalizedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  });

  return items;
}

function getResultGroupKey(result) {
  return result.groupId ? `group-${result.groupId}` : `group-${String(result.groupName || "").toLowerCase()}`;
}

function getResultTestKey(result) {
  return result.testId ? `test-${result.testId}` : `test-${String(result.testTitle || "").toLowerCase()}`;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeFilename(value) {
  const normalized = String(value || "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .trim();

  return normalized || "natijalar";
}

function padNumber(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
}

function formatExportDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate()
  )} ${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

function formatExportDuration(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "00:00";
  }

  const match = text.match(/(\d+)\s*daqiqa\s*(\d+)\s*soniya/i);

  if (match) {
    return `${padNumber(match[1])}:${padNumber(match[2])}`;
  }

  const numericValue = Number(text);

  if (Number.isFinite(numericValue)) {
    const minutes = Math.floor(numericValue / 60);
    const seconds = numericValue % 60;
    return `${padNumber(minutes)}:${padNumber(seconds)}`;
  }

  return text;
}

function downloadExcelWorksheet({ filename, worksheetName, columns, rows }) {
  const headerXml = columns
    .map((column) => `<Cell><Data ss:Type="String">${escapeXml(column)}</Data></Cell>`)
    .join("");
  const rowsXml = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => {
            const isNumber = typeof cell === "number" && Number.isFinite(cell);
            return `<Cell><Data ss:Type="${isNumber ? "Number" : "String"}">${escapeXml(
              cell
            )}</Data></Cell>`;
          })
          .join("")}</Row>`
    )
    .join("");
  const workbookXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${escapeXml(worksheetName)}">
    <Table>
      <Row>${headerXml}</Row>
      ${rowsXml}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([workbookXml], {
    type: "application/vnd.ms-excel;charset=utf-8;"
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${sanitizeFilename(filename)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

function escapePdfText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function wrapPdfText(text, maxLength = 88) {
  const words = String(text || "").split(/\s+/).filter(Boolean);

  if (!words.length) {
    return [""];
  }

  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = candidate;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function truncatePdfCellText(value, maxLength) {
  const text = String(value ?? "");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function truncatePdfCellTextSafe(value, maxLength) {
  const text = String(value ?? "");

  if (text.length <= maxLength) {
    return text;
  }

  if (maxLength <= 3) {
    return text.slice(0, maxLength);
  }

  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function downloadPdfDocument({ filename, title, rows }) {
  const columns = [
    { key: "studentName", label: "Talaba", width: 150, maxLength: 24 },
    { key: "scorePercent", label: "Natija", width: 56, maxLength: 7 },
    { key: "correctCount", label: "To'g'ri", width: 50, maxLength: 6 },
    { key: "wrongCount", label: "Xato", width: 45, maxLength: 6 },
    { key: "unansweredCount", label: "Bo'sh", width: 45, maxLength: 6 },
    { key: "timeSpentText", label: "Vaqt", width: 58, maxLength: 5 },
    { key: "submittedAt", label: "Sana", width: 130, maxLength: 16 }
  ];
  const rowsPerPage = 24;
  const pageRows = [];

  for (let index = 0; index < rows.length; index += rowsPerPage) {
    pageRows.push(rows.slice(index, index + rowsPerPage));
  }

  if (!pageRows.length) {
    pageRows.push([]);
  }

  const fontId = 3 + pageRows.length * 2;
  const objects = {
    1: "<< /Type /Catalog /Pages 2 0 R >>",
    2: `<< /Type /Pages /Count ${pageRows.length} /Kids [${pageRows
      .map((_, index) => `${3 + index * 2} 0 R`)
      .join(" ")}] >>`,
    [fontId]: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  };

  pageRows.forEach((page, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const startX = 24;
    const titleY = 804;
    const summaryY = 782;
    const tableTop = 742;
    const rowHeight = 24;
    const headerHeight = 26;
    const tableWidth = columns.reduce((total, column) => total + column.width, 0);
    const tableHeight = headerHeight + page.length * rowHeight;
    const commands = [
      "0.6 w",
      `24 ${tableTop + 6} m ${24 + tableWidth} ${tableTop + 6} l S`
    ];

    commands.push("BT");
    commands.push("/F1 16 Tf");
    commands.push(`1 0 0 1 ${startX} ${titleY} Tm (${escapePdfText(title)}) Tj`);
    commands.push("/F1 11 Tf");
    commands.push(
      `1 0 0 1 ${startX} ${summaryY} Tm (${escapePdfText(`Jami o'quvchi: ${rows.length}`)}) Tj`
    );
    commands.push("ET");

    let currentX = startX;
    columns.forEach((column) => {
      commands.push(`${currentX} ${tableTop} m ${currentX} ${tableTop - tableHeight} l S`);
      commands.push("BT");
      commands.push("/F1 10 Tf");
      commands.push(
        `1 0 0 1 ${currentX + 4} ${tableTop - 17} Tm (${escapePdfText(column.label)}) Tj`
      );
      commands.push("ET");
      currentX += column.width;
    });
    commands.push(`${startX + tableWidth} ${tableTop} m ${startX + tableWidth} ${tableTop - tableHeight} l S`);
    commands.push(`${startX} ${tableTop} m ${startX + tableWidth} ${tableTop} l S`);
    commands.push(
      `${startX} ${tableTop - headerHeight} m ${startX + tableWidth} ${tableTop - headerHeight} l S`
    );

    page.forEach((row, rowIndex) => {
      const rowTop = tableTop - headerHeight - rowIndex * rowHeight;
      const rowBottom = rowTop - rowHeight;
      let cellX = startX;

      commands.push(`${startX} ${rowBottom} m ${startX + tableWidth} ${rowBottom} l S`);

      columns.forEach((column) => {
        const rawValue =
          column.key === "scorePercent" ? `${row[column.key]}%` : row[column.key];
        const cellText = truncatePdfCellTextSafe(rawValue, column.maxLength);

        commands.push("BT");
        commands.push("/F1 9 Tf");
        commands.push(
          `1 0 0 1 ${cellX + 4} ${rowTop - 16} Tm (${escapePdfText(cellText)}) Tj`
        );
        commands.push("ET");

        cellX += column.width;
      });
    });

    const stream = commands.join("\n");

    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  const objectIds = Object.keys(objects)
    .map((id) => Number(id))
    .sort((left, right) => left - right);
  const offsets = [];
  let pdf = "%PDF-1.4\n";

  objectIds.forEach((id) => {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objectIds[objectIds.length - 1] + 1}\n0000000000 65535 f \n`;

  for (let id = 1; id <= objectIds[objectIds.length - 1]; id += 1) {
    pdf += `${String(offsets[id] || 0).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objectIds[objectIds.length - 1] + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${sanitizeFilename(filename)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

const ADMIN_PAGES = {
  overview: {
    kicker: "Dashboard",
    title: "Test boshqaruv markazi",
    description: "Asosiy ko'rsatkichlar va tezkor yo'nalishlar."
  },
  group: {
    kicker: "Groups",
    title: "Guruhlar",
    description: "Guruhlar ro'yxatini boshqaring va kerak bo'lsa yangi guruh yarating."
  },
  student: {
    kicker: "Students",
    title: "Talabalar bo'limi",
    description: "Talabalarni guruhlarga biriktiring va ro'yxatni ko'ring."
  },
  test: {
    kicker: "Tests",
    title: "Testlar",
    description: "Testlarni yarating va ro'yxatini boshqaring."
  },
  tests: {
    kicker: "Tests",
    title: "Testlar",
    description: "Testlarni yarating va ro'yxatini boshqaring."
  },
  results: {
    kicker: "Results",
    title: "Natijalar",
    description: "Topshirishlar va oxirgi ko'rsatkichlar."
  }
};

const DEFAULT_ADMIN_PAGE = "overview";

function getAdminPageFromHash(hash) {
  const key = String(hash || "").replace(/^#/, "");
  if (key === "tests") {
    return "test";
  }
  return Object.prototype.hasOwnProperty.call(ADMIN_PAGES, key) ? key : DEFAULT_ADMIN_PAGE;
}

function IconBase({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {children}
    </svg>
  );
}

function OverviewIcon() {
  return (
    <IconBase>
      <path d="M4.5 12.5 12 5l7.5 7.5" />
      <path d="M6.5 10.5v8h11v-8" />
    </IconBase>
  );
}

function GroupIcon() {
  return (
    <IconBase>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 10.5h8" />
      <path d="M8 14.5h5" />
    </IconBase>
  );
}

function StudentIcon() {
  return (
    <IconBase>
      <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </IconBase>
  );
}

function CreateTestIcon() {
  return (
    <IconBase>
      <path d="M8 4.5h8" />
      <path d="M9 4.5v2a3 3 0 0 1-1.4 2.6l-1 .6A4 4 0 0 0 5 13v3a3.5 3.5 0 0 0 3.5 3.5h7A3.5 3.5 0 0 0 19 16v-3a4 4 0 0 0-1.6-3.3l-1-.6A3 3 0 0 1 15 6.5v-2" />
      <path d="M12 10v6" />
      <path d="M9 13h6" />
    </IconBase>
  );
}

function TestListIcon() {
  return (
    <IconBase>
      <path d="M7 6.5h10" />
      <path d="M7 12h10" />
      <path d="M7 17.5h10" />
      <path d="M4.5 6.5h.01" />
      <path d="M4.5 12h.01" />
      <path d="M4.5 17.5h.01" />
    </IconBase>
  );
}

function ResultIcon() {
  return (
    <IconBase>
      <path d="M6 18.5V11" />
      <path d="M12 18.5V7.5" />
      <path d="M18 18.5V4.5" />
    </IconBase>
  );
}

function ViewIcon() {
  return (
    <IconBase>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

function EditIcon() {
  return (
    <IconBase>
      <path d="M4.5 19.5h4l9.2-9.2a1.8 1.8 0 0 0 0-2.6l-1.4-1.4a1.8 1.8 0 0 0-2.6 0L4.5 15.5v4Z" />
      <path d="m12.5 7.5 4 4" />
    </IconBase>
  );
}

function DeleteIcon() {
  return (
    <IconBase>
      <path d="M5.5 7.5h13" />
      <path d="M9 7.5V5.5h6v2" />
      <path d="M8.5 10.5v7" />
      <path d="M12 10.5v7" />
      <path d="M15.5 10.5v7" />
      <path d="M7 7.5l.8 11a2 2 0 0 0 2 1.9h4.4a2 2 0 0 0 2-1.9l.8-11" />
    </IconBase>
  );
}

function AdminDashboard({
  user,
  dashboard,
  error,
  isLoading,
  onDashboardUpdate,
  onLogout,
  onRefresh
}) {
  const groups = dashboard?.groups || [];
  const tests = dashboard?.tests || [];
  const recentResults = dashboard?.recentResults || [];
  const summary = dashboard?.summary || {
    groupCount: 0,
    studentCount: 0,
    testCount: 0,
    attemptCount: 0
  };

  const [groupForm, setGroupForm] = useState(initialGroupForm);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [testForm, setTestForm] = useState(initialTestForm);
  const [status, setStatus] = useState({});
  const [busyForm, setBusyForm] = useState("");
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [selectedGroupStudentIds, setSelectedGroupStudentIds] = useState([]);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [resultSearchQuery, setResultSearchQuery] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [testPage, setTestPage] = useState(1);
  const [resultPage, setResultPage] = useState(1);
  const [selectedResultGroupKey, setSelectedResultGroupKey] = useState("");
  const [selectedResultTestKey, setSelectedResultTestKey] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [viewingGroupId, setViewingGroupId] = useState(null);
  const [groupViewTab, setGroupViewTab] = useState("info");
  const [confirmingDeleteGroupId, setConfirmingDeleteGroupId] = useState(null);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [viewingStudentId, setViewingStudentId] = useState(null);
  const [studentViewTab, setStudentViewTab] = useState("info");
  const [confirmingDeleteStudentId, setConfirmingDeleteStudentId] = useState(null);
  const [isTestFormOpen, setIsTestFormOpen] = useState(false);
  const [testFormStep, setTestFormStep] = useState(1);
  const [currentPage, setCurrentPage] = useState(() =>
    typeof window === "undefined" ? DEFAULT_ADMIN_PAGE : getAdminPageFromHash(window.location.hash)
  );

  useEffect(() => {
    if (!groups.length) {
      return;
    }

    setStudentForm((current) =>
      current.groupId === "" || groups.some((group) => String(group.id) === String(current.groupId))
        ? current
        : { ...current, groupId: "" }
    );
    setTestForm((current) =>
      groups.some((group) => String(group.id) === String(current.groupId))
        ? current
        : { ...current, groupId: String(groups[0].id) }
    );
  }, [groups]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleHashChange = () => {
      setCurrentPage(getAdminPageFromHash(window.location.hash));
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigationItems = [
    {
      key: "overview",
      label: "Bosh panel",
      meta: "Kunlik holat",
      icon: <OverviewIcon />
    },
    {
      key: "group",
      label: "Guruhlar",
      meta: `${summary.groupCount} guruh`,
      icon: <GroupIcon />
    },
    {
      key: "student",
      label: "Talabalar",
      meta: `${summary.studentCount} talaba`,
      icon: <StudentIcon />
    },
    {
      key: "test",
      label: "Testlar",
      meta: `${summary.testCount} test`,
      icon: <TestListIcon />
    },
    {
      key: "results",
      label: "Natijalar",
      meta: `${summary.attemptCount} topshirish`,
      icon: <ResultIcon />
    }
  ];

  const profileName = dashboard?.teacher?.name || user.name;
  const profileInitials = getInitials(profileName);
  const unassignedStudents = dashboard?.unassignedStudents || [];
  const allStudents = [
    ...groups.flatMap((group) =>
      group.students.map((student) => ({
        ...student,
        groupName: group.name
      }))
    ),
    ...unassignedStudents.map((student) => ({
      ...student,
      groupName: "Biriktirilmagan"
    }))
  ];
  const editingGroup = groups.find((group) => group.id === editingGroupId) || null;
  const viewingGroup = groups.find((group) => group.id === viewingGroupId) || null;
  const viewingGroupTests = viewingGroup
    ? tests.filter((test) => String(test.groupId) === String(viewingGroup.id))
    : [];
  const confirmingDeleteGroup =
    groups.find((group) => group.id === confirmingDeleteGroupId) || null;
  const groupStudentOptions = Array.from(
    new Map([...(editingGroup?.students || []), ...unassignedStudents].map((student) => [student.id, student]))
      .values()
  );
  const selectedGroupStudents = groupStudentOptions.filter((student) =>
    selectedGroupStudentIds.includes(student.id)
  );
  const viewingStudent = allStudents.find((student) => student.id === viewingStudentId) || null;
  const viewingStudentTests =
    viewingStudent && viewingStudent.groupId
      ? tests.filter((test) => String(test.groupId) === String(viewingStudent.groupId))
      : [];
  const viewingStudentResults =
    dashboard?.recentResults?.filter((result) => result.studentId === viewingStudentId) || [];
  const confirmingDeleteStudent =
    allStudents.find((student) => student.id === confirmingDeleteStudentId) || null;
  const groupSearchText = normalizeSearchText(groupSearchQuery);
  const studentSearchText = normalizeSearchText(studentSearchQuery);
  const testSearchText = normalizeSearchText(testSearchQuery);
  const resultSearchText = normalizeSearchText(resultSearchQuery);
  const filteredGroups = groups.filter((group) =>
    `${group.name} ${group.schedule} ${group.room} ${group.students.length}`
      .toLowerCase()
      .includes(groupSearchText)
  );
  const filteredStudents = allStudents.filter((student) =>
    `${student.name} ${student.phone} ${student.groupName}`.toLowerCase().includes(studentSearchText)
  );
  const filteredTests = tests.filter((test) =>
    `${test.title} ${test.groupName} ${test.description} ${statusLabel(test.status)}`
      .toLowerCase()
      .includes(testSearchText)
  );
  const resultGroups = Array.from(
    recentResults.reduce((collection, result) => {
      const key = getResultGroupKey(result);
      const current = collection.get(key) || {
        key,
        name: result.groupName,
        resultCount: 0,
        averageScoreTotal: 0,
        tests: new Set()
      };

      current.resultCount += 1;
      current.averageScoreTotal += Number(result.scorePercent) || 0;
      current.tests.add(getResultTestKey(result));
      collection.set(key, current);
      return collection;
    }, new Map()).values()
  )
    .map((group) => ({
      ...group,
      testCount: group.tests.size,
      averageScore: group.resultCount ? Math.round(group.averageScoreTotal / group.resultCount) : 0
    }))
    .sort((left, right) => String(left.name).localeCompare(String(right.name), "uz"));
  const selectedResultGroup =
    resultGroups.find((group) => group.key === selectedResultGroupKey) || null;
  const selectedGroupResults = selectedResultGroupKey
    ? recentResults.filter((result) => getResultGroupKey(result) === selectedResultGroupKey)
    : [];
  const resultTests = Array.from(
    selectedGroupResults.reduce((collection, result) => {
      const key = getResultTestKey(result);
      const current = collection.get(key) || {
        key,
        title: result.testTitle,
        resultCount: 0,
        averageScoreTotal: 0,
        studentIds: new Set(),
        submittedAt: result.submittedAt
      };

      current.resultCount += 1;
      current.averageScoreTotal += Number(result.scorePercent) || 0;
      current.studentIds.add(result.studentId || `${result.studentName}-${result.id}`);
      if (new Date(result.submittedAt).getTime() > new Date(current.submittedAt).getTime()) {
        current.submittedAt = result.submittedAt;
      }
      collection.set(key, current);
      return collection;
    }, new Map()).values()
  )
    .map((test) => ({
      ...test,
      studentCount: test.studentIds.size,
      averageScore: test.resultCount ? Math.round(test.averageScoreTotal / test.resultCount) : 0
    }))
    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
  const selectedResultTest = resultTests.find((test) => test.key === selectedResultTestKey) || null;
  const selectedTestResults = selectedResultTestKey
    ? selectedGroupResults
        .filter((result) => getResultTestKey(result) === selectedResultTestKey)
        .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())
    : [];
  const filteredResultGroups = resultGroups.filter((group) =>
    `${group.name} ${group.resultCount} ${group.testCount} ${group.averageScore}`
      .toLowerCase()
      .includes(resultSearchText)
  );
  const filteredResultTests = resultTests.filter((test) =>
    `${test.title} ${test.resultCount} ${test.studentCount} ${test.averageScore}`
      .toLowerCase()
      .includes(resultSearchText)
  );
  const filteredDetailedResults = selectedTestResults.filter((result) =>
    `${result.studentName} ${result.groupName} ${result.testTitle} ${result.scorePercent} ${result.submittedAt}`
      .toLowerCase()
      .includes(resultSearchText)
  );
  const activeResultItems = selectedResultTestKey
    ? filteredDetailedResults
    : selectedResultGroupKey
      ? filteredResultTests
      : filteredResultGroups;
  const groupPagination = paginateItems(filteredGroups, groupPage);
  const studentPagination = paginateItems(filteredStudents, studentPage);
  const testPagination = paginateItems(filteredTests, testPage);
  const resultPagination = paginateItems(activeResultItems, resultPage);
  const shouldSimplifyMainHeader =
    currentPage === "group" ||
    currentPage === "student" ||
    currentPage === "test" ||
    currentPage === "results";
  const isImmersiveTestBuilder = currentPage === "test" && isTestFormOpen;
  const resultSearchPlaceholder = selectedResultTestKey
    ? "O'quvchini izlash"
    : selectedResultGroupKey
      ? "Testni izlash"
      : "Guruhni izlash";
  const isTestDetailsComplete =
    Boolean(testForm.title.trim()) &&
    Boolean(testForm.groupId) &&
    Boolean(testForm.startTime) &&
    Boolean(testForm.endTime) &&
    Boolean(String(testForm.durationMinutes).trim()) &&
    Number(testForm.durationMinutes) > 0;

  useEffect(() => {
    setGroupPage(1);
  }, [groupSearchQuery]);

  useEffect(() => {
    setStudentPage(1);
  }, [studentSearchQuery]);

  useEffect(() => {
    setTestPage(1);
  }, [testSearchQuery]);

  useEffect(() => {
    setResultPage(1);
  }, [resultSearchQuery]);

  useEffect(() => {
    setSelectedResultTestKey("");
    setResultPage(1);
  }, [selectedResultGroupKey]);

  useEffect(() => {
    setResultPage(1);
  }, [selectedResultTestKey]);

  useEffect(() => {
    if (groupPage > groupPagination.totalPages) {
      setGroupPage(groupPagination.totalPages);
    }
  }, [groupPage, groupPagination.totalPages]);

  useEffect(() => {
    if (studentPage > studentPagination.totalPages) {
      setStudentPage(studentPagination.totalPages);
    }
  }, [studentPage, studentPagination.totalPages]);

  useEffect(() => {
    if (testPage > testPagination.totalPages) {
      setTestPage(testPagination.totalPages);
    }
  }, [testPage, testPagination.totalPages]);

  useEffect(() => {
    if (resultPage > resultPagination.totalPages) {
      setResultPage(resultPagination.totalPages);
    }
  }, [resultPage, resultPagination.totalPages]);

  async function request(path, options = {}) {
    const { method = "GET", payload } = options;
    const requestOptions = {
      method,
      headers: {}
    };

    if (payload !== undefined) {
      requestOptions.headers["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(`${API_URL}${path}`, requestOptions);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "So'rov bajarilmadi");
    }

    return data;
  }

  async function handleGroupSubmit(event) {
    event.preventDefault();
    setBusyForm("group");

    try {
      const data = await request(
        editingGroupId ? `/admin/groups/${editingGroupId}` : "/admin/groups",
        {
          method: editingGroupId ? "PATCH" : "POST",
          payload: {
            ...groupForm,
            studentIds: selectedGroupStudentIds
          }
        }
      );
      onDashboardUpdate(data.data);
      setGroupForm(initialGroupForm);
      setSelectedGroupStudentIds([]);
      setIsGroupFormOpen(false);
      setEditingGroupId(null);
      setStatus((current) => ({
        ...current,
        group: { type: "success", message: data.message }
      }));
    } catch (requestError) {
      setStatus((current) => ({
        ...current,
        group: { type: "error", message: requestError.message }
      }));
    } finally {
      setBusyForm("");
    }
  }

  function openCreateGroupModal() {
    setEditingGroupId(null);
    setGroupForm(initialGroupForm);
    setSelectedGroupStudentIds([]);
    setIsGroupFormOpen(true);
  }

  function openEditGroupModal(group) {
    setViewingGroupId(null);
    setEditingGroupId(group.id);
    setGroupForm({
      name: group.name || "",
      schedule: group.schedule === "Belgilanmagan" ? "" : group.schedule || "",
      room: group.room === "Belgilanmagan" ? "" : group.room || ""
    });
    setSelectedGroupStudentIds(group.students.map((student) => student.id));
    setIsGroupFormOpen(true);
  }

  async function confirmGroupDelete() {
    if (!confirmingDeleteGroup) {
      return;
    }

    setBusyForm(`group-delete-${confirmingDeleteGroup.id}`);

    try {
      const data = await request(`/admin/groups/${confirmingDeleteGroup.id}`, {
        method: "DELETE"
      });
      onDashboardUpdate(data.data);
      setViewingGroupId((current) => (current === confirmingDeleteGroup.id ? null : current));
      setEditingGroupId((current) => (current === confirmingDeleteGroup.id ? null : current));
      setIsGroupFormOpen((current) => (editingGroupId === confirmingDeleteGroup.id ? false : current));
      setGroupForm((current) =>
        editingGroupId === confirmingDeleteGroup.id ? initialGroupForm : current
      );
      setSelectedGroupStudentIds((current) =>
        editingGroupId === confirmingDeleteGroup.id ? [] : current
      );
      setConfirmingDeleteGroupId(null);
      setStatus((current) => ({
        ...current,
        group: { type: "success", message: data.message }
      }));
    } catch (requestError) {
      setStatus((current) => ({
        ...current,
        group: { type: "error", message: requestError.message }
      }));
    } finally {
      setBusyForm("");
    }
  }

  async function handleStudentSubmit(event) {
    event.preventDefault();
    setBusyForm("student");

    try {
      const data = await request(editingStudentId ? `/admin/students/${editingStudentId}` : "/admin/students", {
        method: editingStudentId ? "PATCH" : "POST",
        payload: {
          groupId: studentForm.groupId ? Number(studentForm.groupId) : null,
          name: studentForm.name,
          phone: studentForm.phone,
          password: studentForm.password
        }
      });
      onDashboardUpdate(data.data);
      setStudentForm(initialStudentForm);
      setEditingStudentId(null);
      setIsStudentFormOpen(false);
      setStatus((current) => ({
        ...current,
        student: { type: "success", message: data.message }
      }));
    } catch (requestError) {
      setStatus((current) => ({
        ...current,
        student: { type: "error", message: requestError.message }
      }));
    } finally {
      setBusyForm("");
    }
  }

  function openCreateStudentModal() {
    setEditingStudentId(null);
    setStudentForm(initialStudentForm);
    setIsStudentFormOpen(true);
  }

  function openEditStudentModal(student) {
    setViewingStudentId(null);
    setEditingStudentId(student.id);
    setStudentForm({
      groupId: student.groupId ? String(student.groupId) : "",
      name: student.name || "",
      phone: formatPhoneInput(student.phone),
      password: student.password || ""
    });
    setIsStudentFormOpen(true);
  }

  async function confirmStudentDelete() {
    if (!confirmingDeleteStudent) {
      return;
    }

    setBusyForm(`student-delete-${confirmingDeleteStudent.id}`);

    try {
      const data = await request(`/admin/students/${confirmingDeleteStudent.id}`, {
        method: "DELETE"
      });
      onDashboardUpdate(data.data);
      setViewingStudentId((current) => (current === confirmingDeleteStudent.id ? null : current));
      setEditingStudentId((current) => (current === confirmingDeleteStudent.id ? null : current));
      setIsStudentFormOpen((current) =>
        editingStudentId === confirmingDeleteStudent.id ? false : current
      );
      setStudentForm((current) =>
        editingStudentId === confirmingDeleteStudent.id ? initialStudentForm : current
      );
      setConfirmingDeleteStudentId(null);
      setStatus((current) => ({
        ...current,
        student: { type: "success", message: data.message }
      }));
    } catch (requestError) {
      setStatus((current) => ({
        ...current,
        student: { type: "error", message: requestError.message }
      }));
    } finally {
      setBusyForm("");
    }
  }

  async function handleTestSubmit(event) {
    event.preventDefault();
    setBusyForm("test");

    try {
      const data = await request("/admin/tests", {
        method: "POST",
        payload: {
          title: testForm.title,
          groupId: Number(testForm.groupId),
          description: testForm.description,
          durationMinutes: Number(testForm.durationMinutes),
          startTime: testForm.startTime,
          endTime: testForm.endTime,
          questions: testForm.questions.map((question) => ({
            prompt: question.prompt,
            image: question.image,
            options: question.options,
            correctOptionId: question.correctOptionId
          }))
        }
      });
      onDashboardUpdate(data.data);
      setTestForm(createInitialTestForm(groups[0] ? String(groups[0].id) : ""));
      setIsTestFormOpen(false);
      setTestFormStep(1);
      setStatus((current) => ({
        ...current,
        test: { type: "success", message: data.message }
      }));
    } catch (requestError) {
      setStatus((current) => ({
        ...current,
        test: { type: "error", message: requestError.message }
      }));
    } finally {
      setBusyForm("");
    }
  }

  function addQuestion() {
    setTestForm((current) => ({
      ...current,
      questions: [...current.questions, createQuestion()]
    }));
  }

  function removeQuestion(questionKey) {
    setTestForm((current) => ({
      ...current,
      questions:
        current.questions.length === 1
          ? current.questions
          : current.questions.filter((question) => question.key !== questionKey)
    }));
  }

  function updateQuestion(questionKey, field, value) {
    setTestForm((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.key === questionKey ? { ...question, [field]: value } : question
      )
    }));
  }

  function updateQuestionOption(questionKey, optionId, value) {
    setTestForm((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.key === questionKey
          ? {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, text: value } : option
              )
            }
          : question
      )
    }));
  }

  function addQuestionOption(questionKey) {
    setTestForm((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.key !== questionKey || question.options.length >= MAX_TEST_OPTIONS) {
          return question;
        }

        return {
          ...question,
          options: [...question.options, createOption(question.options.length)]
        };
      })
    }));
  }

  function removeQuestionOption(questionKey, optionId) {
    setTestForm((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.key !== questionKey || question.options.length <= 2) {
          return question;
        }

        const nextOptions = question.options.filter((option) => option.id !== optionId);

        return {
          ...question,
          options: nextOptions,
          correctOptionId:
            question.correctOptionId === optionId ? nextOptions[0]?.id || "" : question.correctOptionId
        };
      })
    }));
  }

  async function handleQuestionImageChange(questionKey, file) {
    if (!file) {
      updateQuestion(questionKey, "image", "");
      return;
    }

    try {
      const image = await readFileAsDataUrl(file);
      updateQuestion(questionKey, "image", image);
    } catch (requestError) {
      setStatus((current) => ({
        ...current,
        test: {
          type: "error",
          message: requestError.message
        }
      }));
    }
  }

  function openCreateTestModal() {
    setTestForm(createInitialTestForm(groups[0] ? String(groups[0].id) : ""));
    setIsTestFormOpen(true);
    setTestFormStep(1);
    setStatus((current) => ({
      ...current,
      test: null
    }));
  }

  function closeCreateTestPage() {
    setIsTestFormOpen(false);
    setTestFormStep(1);
  }

  function exportSelectedResultsToExcel() {
    if (!selectedResultTest || !filteredDetailedResults.length) {
      return;
    }

    downloadExcelWorksheet({
      filename: `${selectedResultGroup?.name || "Guruh"} ${selectedResultTest.title} natijalar`,
      worksheetName: "Natijalar",
      columns: [
        "Talaba",
        "Guruh",
        "Test",
        "Natija (%)",
        "To'g'ri",
        "Xato",
        "Bo'sh",
        "Vaqt",
        "Sana"
      ],
      rows: filteredDetailedResults.map((result) => [
        result.studentName,
        result.groupName,
        result.testTitle,
        Number(result.scorePercent) || 0,
        result.correctCount,
        result.wrongCount,
        result.unansweredCount,
        formatExportDuration(result.timeSpentText),
        formatExportDateTime(result.submittedAt)
      ])
    });
  }

  function exportSelectedResultsToPdf() {
    if (!selectedResultTest || !filteredDetailedResults.length) {
      return;
    }

    downloadPdfDocument({
      filename: `${selectedResultGroup?.name || "Guruh"} ${selectedResultTest.title} natijalar`,
      title: `${selectedResultGroup?.name || "Guruh"} / ${selectedResultTest.title}`,
      rows: filteredDetailedResults.map((result) => ({
        studentName: result.studentName,
        scorePercent: result.scorePercent,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        unansweredCount: result.unansweredCount,
        timeSpentText: formatExportDuration(result.timeSpentText),
        submittedAt: formatExportDateTime(result.submittedAt)
      }))
    });
  }

  function goToTestQuestionStep() {
    if (!isTestDetailsComplete) {
      setStatus((current) => ({
        ...current,
        test: {
          type: "error",
          message: "Avval test ma'lumotlarini to'liq kiriting."
        }
      }));
      return;
    }

    setStatus((current) => ({
      ...current,
      test: current.test?.type === "error" ? null : current.test
    }));
    setTestFormStep(2);
  }

  const latestTest = [...tests].sort(
    (left, right) => new Date(right.startTime || 0).getTime() - new Date(left.startTime || 0).getTime()
  )[0];
  const currentPageMeta = ADMIN_PAGES[currentPage] || ADMIN_PAGES[DEFAULT_ADMIN_PAGE];

  function renderPagination(currentPageValue, totalPages, onChange) {
    if (totalPages <= 1) {
      return null;
    }

    return (
      <div className="admin-pagination">
        <button
          className="admin-pagination__button"
          type="button"
          disabled={currentPageValue === 1}
          onClick={() => onChange(currentPageValue - 1)}
        >
          {"<"}
        </button>

        {getPaginationItems(currentPageValue, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <span className="admin-pagination__ellipsis" key={`ellipsis-${index}`}>
              ...
            </span>
          ) : (
            <button
              className={`admin-pagination__button${item === currentPageValue ? " is-active" : ""}`}
              key={item}
              type="button"
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          )
        )}

        <button
          className="admin-pagination__button"
          type="button"
          disabled={currentPageValue === totalPages}
          onClick={() => onChange(currentPageValue + 1)}
        >
          {">"}
        </button>
      </div>
    );
  }

  function renderOverviewPage() {
    return (
      <>
        <section className="stats-grid crm-stats">
          <article className="stat-card">
            <span>Guruhlar</span>
            <strong>{summary.groupCount}</strong>
            <p>O'qituvchi yuritayotgan guruhlar soni</p>
          </article>
          <article className="stat-card">
            <span>Talabalar</span>
            <strong>{summary.studentCount}</strong>
            <p>Telefon va parol berilgan talabalar</p>
          </article>
          <article className="stat-card">
            <span>Testlar</span>
            <strong>{summary.testCount}</strong>
            <p>Guruhlarga biriktirilgan testlar</p>
          </article>
          <article className="stat-card">
            <span>Natijalar</span>
            <strong>{summary.attemptCount}</strong>
            <p>Talabalar topshirgan urinishlar soni</p>
          </article>
        </section>

        <section className="admin-page-grid admin-page-grid--three">
          <article className="panel-card">
            <div className="panel-head">
              <div>
                <span className="section-kicker">So'nggi test</span>
                <h2>{latestTest ? latestTest.title : "Hali test yo'q"}</h2>
              </div>
            </div>
            <p className="test-copy">
              {latestTest
                ? `${latestTest.groupName} guruhi uchun ${latestTest.durationMinutes} daqiqalik test.`
                : "Testlar yaratilgandan keyin bu yerda ko'rinadi."}
            </p>
          </article>

          <article className="panel-card">
            <div className="panel-head">
              <div>
                <span className="section-kicker">Faol guruhlar</span>
                <h2>{groups.length ? groups[0].name : "Hali guruh yo'q"}</h2>
              </div>
            </div>
            <p className="test-copy">
              {groups.length
                ? `${groups.length} ta guruh ichida ${summary.studentCount} ta talaba mavjud.`
                : "Avval guruh yaratish bo'limidan yangi guruh qo'shing."}
            </p>
          </article>

          <article className="panel-card">
            <div className="panel-head">
              <div>
                <span className="section-kicker">So'nggi natija</span>
                <h2>{recentResults[0] ? recentResults[0].studentName : "Natija yo'q"}</h2>
              </div>
            </div>
            <p className="test-copy">
              {recentResults[0]
                ? `${recentResults[0].testTitle} bo'yicha ${recentResults[0].scorePercent}% natija qayd etilgan.`
                : "Talabalar test topshirgach, bu yerda ko'rinadi."}
            </p>
          </article>
        </section>
      </>
    );
  }

  function renderGroupPage() {
    return (
      <section className="teacher-page-stack">
        <article className="panel-card">
          <div className="admin-page-toolbar">
            <div>
              <span className="section-kicker">Groups</span>
              <h2>Guruhlar ro'yxati</h2>
              <p className="test-copy">Barcha guruhlar jadval ko'rinishida shu yerda turadi.</p>
            </div>

            <button
              className="primary-button admin-toolbar-button"
              type="button"
              onClick={() => setIsGroupFormOpen((current) => !current)}
            >
              {isGroupFormOpen ? "Yopish" : "+ Guruh yaratish"}
            </button>
          </div>

          {status.group ? (
            <p className={`inline-status ${status.group.type}`}>{status.group.message}</p>
          ) : null}
        </article>

        {isGroupFormOpen ? (
          <article className="panel-card">
            <div className="panel-head">
              <div>
                <span className="section-kicker">New Group</span>
                <h2>Yangi guruh yaratish</h2>
              </div>
            </div>

            <form className="form-stack" onSubmit={handleGroupSubmit}>
              <label className="field">
                <span>Guruh nomi</span>
                <input
                  value={groupForm.name}
                  onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })}
                  placeholder="Masalan, Aydos 303"
                  required
                />
              </label>
              <label className="field">
                <span>Jadval</span>
                <input
                  value={groupForm.schedule}
                  onChange={(event) => setGroupForm({ ...groupForm, schedule: event.target.value })}
                  placeholder="Du, Chor, Ju / 12:00"
                />
              </label>
              <label className="field">
                <span>Xona</span>
                <input
                  value={groupForm.room}
                  onChange={(event) => setGroupForm({ ...groupForm, room: event.target.value })}
                  placeholder="Xona 402"
                />
              </label>
              <button className="primary-button" type="submit" disabled={busyForm === "group"}>
                {busyForm === "group" ? "Saqlanmoqda..." : "Guruh yaratish"}
              </button>
            </form>
          </article>
        ) : null}

        <article className="panel-card">
          <div className="panel-head">
            <div>
              <span className="section-kicker">Groups</span>
              <h2>Mavjud guruhlar</h2>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Guruh nomi</th>
                  <th>Jadval</th>
                  <th>Xona</th>
                  <th>Talabalar</th>
                  <th>Testlar</th>
                </tr>
              </thead>
              <tbody>
                {groups.length ? (
                  groups.map((group, index) => (
                    <tr key={group.id}>
                      <td>{index + 1}</td>
                      <td>{group.name}</td>
                      <td>{group.schedule || "Belgilanmagan"}</td>
                      <td>{group.room || "Belgilanmagan"}</td>
                      <td>{group.students.length} ta</td>
                      <td>
                        {
                          tests.filter(
                            (test) =>
                              String(test.groupId) === String(group.id) || test.groupName === group.name
                          ).length
                        }{" "}
                        ta
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="admin-table__empty" colSpan="6">
                      Hozircha guruhlar yo'q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    );
  }

  function renderGroupPageSimple() {
    return (
      <section className="teacher-page-stack">
        <article className="panel-card">
          <div className="admin-page-toolbar admin-page-toolbar--search">
            <label className="admin-search-field">
              <input
                className="admin-search-input"
                value={groupSearchQuery}
                onChange={(event) => setGroupSearchQuery(event.target.value)}
                placeholder="Guruhni izlash"
                type="search"
              />
            </label>
            <button
              className="primary-button admin-toolbar-button"
              type="button"
              onClick={openCreateGroupModal}
            >
              + Guruh yaratish
            </button>
          </div>

          {status.group ? (
            <p className={`inline-status ${status.group.type}`}>{status.group.message}</p>
          ) : null}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Guruh</th>
                  <th>Jadval</th>
                  <th>Xona</th>
                  <th>Talabalar</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {groupPagination.items.length ? (
                  groupPagination.items.map((group, index) => (
                    <tr key={group.id}>
                      <td>{(groupPagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td>{group.name}</td>
                      <td>{group.schedule || "-"}</td>
                      <td>{group.room || "-"}</td>
                      <td>{group.students.length} ta</td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="admin-icon-button"
                            type="button"
                            title="Ko'rish"
                            aria-label={`${group.name} guruhini ko'rish`}
                            onClick={() => {
                              setGroupViewTab("info");
                              setViewingGroupId(group.id);
                            }}
                          >
                            <ViewIcon />
                          </button>
                          <button
                            className="admin-icon-button"
                            type="button"
                            title="Tahrirlash"
                            aria-label={`${group.name} guruhini tahrirlash`}
                            onClick={() => openEditGroupModal(group)}
                          >
                            <EditIcon />
                          </button>
                          <button
                            className="admin-icon-button admin-icon-button--danger"
                            type="button"
                            title="O'chirish"
                            aria-label={`${group.name} guruhini o'chirish`}
                            disabled={busyForm === `group-delete-${group.id}`}
                            onClick={() => setConfirmingDeleteGroupId(group.id)}
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="admin-table__empty" colSpan="6">
                      Guruh topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(groupPagination.currentPage, groupPagination.totalPages, setGroupPage)}
        </article>

        {isGroupFormOpen ? (
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onClick={() => {
              setIsGroupFormOpen(false);
              setEditingGroupId(null);
              setGroupForm(initialGroupForm);
              setSelectedGroupStudentIds([]);
            }}
          >
            <article
              className="panel-card admin-modal"
              role="dialog"
              aria-modal="true"
              aria-label={editingGroupId ? "Guruhni tahrirlash" : "Guruh yaratish"}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-head">
                <div>
                  <span className="section-kicker">{editingGroupId ? "Edit Group" : "New Group"}</span>
                  <h2>{editingGroupId ? "Guruhni tahrirlash" : "Guruh yaratish"}</h2>
                </div>
              </div>

              <form className="form-grid form-grid-two admin-group-form" onSubmit={handleGroupSubmit}>
                <label className="field">
                  <span>Guruh nomi</span>
                  <input
                    value={groupForm.name}
                    onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })}
                    placeholder="Masalan, Aydos 303"
                    required
                  />
                </label>
                <label className="field">
                  <span>Jadval</span>
                  <input
                    value={groupForm.schedule}
                    onChange={(event) => setGroupForm({ ...groupForm, schedule: event.target.value })}
                    placeholder="Du, Chor, Ju / 12:00"
                  />
                </label>
                <label className="field">
                  <span>Xona</span>
                  <input
                    value={groupForm.room}
                    onChange={(event) => setGroupForm({ ...groupForm, room: event.target.value })}
                    placeholder="Xona 402"
                  />
                </label>

                <label className="field field-full">
                  <span>Talabalar</span>
                  <select
                    className="admin-student-select"
                    multiple
                    size="8"
                    value={selectedGroupStudentIds.map(String)}
                    onChange={(event) =>
                      setSelectedGroupStudentIds(
                        Array.from(event.target.selectedOptions, (option) => Number(option.value))
                      )
                    }
                  >
                    {editingGroup?.students?.length ? (
                      <optgroup label="Guruhdagi talabalar">
                        {editingGroup.students.map((student) => (
                          <option key={`group-${student.id}`} value={student.id}>
                            {student.name} | {student.phone}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}

                    {unassignedStudents.length ? (
                      <optgroup label="Biriktirilmagan talabalar">
                        {unassignedStudents.map((student) => (
                          <option key={`free-${student.id}`} value={student.id}>
                            {student.name} | {student.phone}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}

                    {!editingGroup?.students?.length && !unassignedStudents.length ? (
                      <option disabled>Biriktirilmagan talabalar yo'q</option>
                    ) : null}
                  </select>
                </label>

                <div className="field-full admin-student-picked">
                  {selectedGroupStudents.length ? (
                    <div className="admin-student-picked__list">
                      {selectedGroupStudents.map((student) => (
                        <button
                          className="admin-student-chip"
                          key={student.id}
                          type="button"
                          onClick={() =>
                            setSelectedGroupStudentIds((current) =>
                              current.filter((studentId) => studentId !== student.id)
                            )
                          }
                        >
                          <span>{student.name}</span>
                          <small>{student.phone}</small>
                          <strong>×</strong>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="test-copy admin-student-picked__empty">
                      {editingGroupId
                        ? "Talabani qo'shish yoki olib tashlash uchun yuqoridagi selectdan tanlang."
                        : "Biriktirilmagan talabalar shu yerda tanlanadi."}
                    </p>
                  )}
                </div>

                <div className="field-full admin-group-form__actions">
                  <button className="primary-button" type="submit" disabled={busyForm === "group"}>
                    {busyForm === "group"
                      ? "Saqlanmoqda..."
                      : editingGroupId
                        ? "Saqlash"
                        : "Guruh yaratish"}
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      setIsGroupFormOpen(false);
                      setEditingGroupId(null);
                      setGroupForm(initialGroupForm);
                      setSelectedGroupStudentIds([]);
                    }}
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </article>
          </div>
        ) : null}

        {viewingGroup ? (
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onClick={() => setViewingGroupId(null)}
          >
            <article
              className="panel-card admin-modal admin-modal--wide"
              role="dialog"
              aria-modal="true"
              aria-label="Guruh ma'lumoti"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-head">
                <div>
                  <span className="section-kicker">Group View</span>
                  <h2>{viewingGroup.name}</h2>
                </div>
              </div>

              <div className="admin-modal-tabs">
                <button
                  className={`admin-modal-tab${groupViewTab === "info" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setGroupViewTab("info")}
                >
                  Guruh ma'lumoti
                </button>
                <button
                  className={`admin-modal-tab${groupViewTab === "students" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setGroupViewTab("students")}
                >
                  Talabalar
                </button>
                <button
                  className={`admin-modal-tab${groupViewTab === "tests" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setGroupViewTab("tests")}
                >
                  Testlar
                </button>
              </div>

              {groupViewTab === "info" ? (
                <div className="admin-modal-section">
                  <div className="admin-modal-grid">
                    <article className="admin-modal-metric">
                      <span>Guruh</span>
                      <strong>{viewingGroup.name}</strong>
                    </article>
                    <article className="admin-modal-metric">
                      <span>Jadval</span>
                      <strong>{viewingGroup.schedule || "-"}</strong>
                    </article>
                    <article className="admin-modal-metric">
                      <span>Xona</span>
                      <strong>{viewingGroup.room || "-"}</strong>
                    </article>
                    <article className="admin-modal-metric">
                      <span>Talabalar</span>
                      <strong>{viewingGroup.students.length} ta</strong>
                    </article>
                    <article className="admin-modal-metric">
                      <span>Testlar</span>
                      <strong>{viewingGroupTests.length} ta</strong>
                    </article>
                  </div>
                </div>
              ) : null}

              {groupViewTab === "students" ? (
                <div className="admin-modal-section">
                  {viewingGroup.students.length ? (
                    <div className="admin-modal-list">
                      {viewingGroup.students.map((student) => (
                        <article className="admin-modal-list__item" key={student.id}>
                          <strong>{student.name}</strong>
                          <span>{student.phone}</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="test-copy">Talabalar yo'q</p>
                  )}
                </div>
              ) : null}

              {groupViewTab === "tests" ? (
                <div className="admin-modal-section">
                  {viewingGroupTests.length ? (
                    <div className="admin-modal-list">
                      {viewingGroupTests.map((test) => (
                        <article className="admin-modal-list__item" key={test.id}>
                          <strong>{test.title}</strong>
                          <span>{test.questionCount} savol</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="test-copy">Testlar yo'q</p>
                  )}
                </div>
              ) : null}
            </article>
          </div>
        ) : null}

        {confirmingDeleteGroup ? (
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onClick={() => setConfirmingDeleteGroupId(null)}
          >
            <article
              className="panel-card admin-modal admin-confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Guruhni o'chirishni tasdiqlash"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="admin-confirm-modal__badge">
                <DeleteIcon />
              </div>

              <div className="admin-confirm-modal__copy">
                <span className="section-kicker">Delete Group</span>
                <h2>{confirmingDeleteGroup.name} guruhini o'chirish</h2>
                <p className="test-copy">
                  Bu amal guruhga bog'langan talabalar, testlar va natijalarni ham o'chiradi.
                </p>
              </div>

              <div className="admin-modal-grid">
                <article className="admin-modal-metric">
                  <span>Talabalar</span>
                  <strong>{confirmingDeleteGroup.students.length} ta</strong>
                </article>
                <article className="admin-modal-metric">
                  <span>Testlar</span>
                  <strong>
                    {
                      tests.filter(
                        (test) => String(test.groupId) === String(confirmingDeleteGroup.id)
                      ).length
                    }{" "}
                    ta
                  </strong>
                </article>
              </div>

              <div className="admin-group-form__actions admin-confirm-modal__actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setConfirmingDeleteGroupId(null)}
                >
                  Bekor qilish
                </button>
                <button
                  className="primary-button admin-confirm-modal__delete"
                  type="button"
                  disabled={busyForm === `group-delete-${confirmingDeleteGroup.id}`}
                  onClick={confirmGroupDelete}
                >
                  {busyForm === `group-delete-${confirmingDeleteGroup.id}`
                    ? "O'chirilmoqda..."
                    : "O'chirish"}
                </button>
              </div>
            </article>
          </div>
        ) : null}
      </section>
    );
  }

  function renderStudentPage() {
    return (
      <section className="teacher-page-stack">
        <article className="panel-card">
          <div className="panel-head">
            <div>
              <span className="section-kicker">New Student</span>
              <h2>Talaba qo'shish</h2>
            </div>
          </div>

          <form className="form-stack" onSubmit={handleStudentSubmit}>
            <label className="field">
              <span>Guruh</span>
              <select
                value={studentForm.groupId}
                onChange={(event) => setStudentForm({ ...studentForm, groupId: event.target.value })}
                required
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Talaba ismi</span>
              <input
                value={studentForm.name}
                onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })}
                placeholder="To'liq ism sharif"
                required
              />
            </label>
            <label className="field">
              <span>Telefon</span>
              <input
                value={studentForm.phone}
                onChange={(event) =>
                  setStudentForm({
                    ...studentForm,
                    phone: formatPhoneInput(event.target.value)
                  })
                }
                placeholder="+998-90-123-45-67"
                required
              />
            </label>
            <label className="field">
              <span>Parol</span>
              <input
                value={studentForm.password}
                onChange={(event) => setStudentForm({ ...studentForm, password: event.target.value })}
                placeholder="Kamida 4 ta belgi"
                required
              />
            </label>
            <button className="primary-button" type="submit" disabled={busyForm === "student"}>
              {busyForm === "student" ? "Qo'shilmoqda..." : "Talaba yaratish"}
            </button>
            {status.student ? (
              <p className={`inline-status ${status.student.type}`}>{status.student.message}</p>
            ) : null}
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <div>
              <span className="section-kicker">Students</span>
              <h2>Talabalar ro'yxati</h2>
            </div>
          </div>

          <div className="group-grid teacher-group-grid">
            {groups.map((group) => (
              <section className="group-card" key={group.id}>
                <div className="group-top">
                  <div>
                    <h3>{group.name}</h3>
                    <p>{group.schedule}</p>
                  </div>
                  <span className="pill">{group.students.length} talaba</span>
                </div>

                <div className="student-list">
                  {group.students.map((studentItem) => (
                    <article className="student-card" key={studentItem.id}>
                      <div>
                        <strong>{studentItem.name}</strong>
                        <p>{studentItem.phone}</p>
                      </div>
                      <div className="meta-row meta-row-tight">
                        <span>Parol: {studentItem.password}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </section>
    );
  }

  function renderStudentPageSimple() {
    return (
      <section className="teacher-page-stack">
        <article className="panel-card">
          <div className="admin-page-toolbar admin-page-toolbar--search">
            <label className="admin-search-field">
              <input
                className="admin-search-input"
                value={studentSearchQuery}
                onChange={(event) => setStudentSearchQuery(event.target.value)}
                placeholder="Talabani izlash"
                type="search"
              />
            </label>
            <button
              className="primary-button admin-toolbar-button"
              type="button"
              onClick={openCreateStudentModal}
            >
              + Talaba qo'shish
            </button>
          </div>

          {status.student ? (
            <p className={`inline-status ${status.student.type}`}>{status.student.message}</p>
          ) : null}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Talaba</th>
                  <th>Telefon</th>
                  <th>Guruh</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {studentPagination.items.length ? (
                  studentPagination.items.map((student, index) => (
                    <tr key={student.id}>
                      <td>{(studentPagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td>{student.name}</td>
                      <td>{student.phone}</td>
                      <td>{student.groupName}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="admin-icon-button"
                            type="button"
                            title="Ko'rish"
                            aria-label={`${student.name} talaba ma'lumotini ko'rish`}
                            onClick={() => {
                              setStudentViewTab("info");
                              setViewingStudentId(student.id);
                            }}
                          >
                            <ViewIcon />
                          </button>
                          <button
                            className="admin-icon-button"
                            type="button"
                            title="Tahrirlash"
                            aria-label={`${student.name} talabani tahrirlash`}
                            onClick={() => openEditStudentModal(student)}
                          >
                            <EditIcon />
                          </button>
                          <button
                            className="admin-icon-button admin-icon-button--danger"
                            type="button"
                            title="O'chirish"
                            aria-label={`${student.name} talabani o'chirish`}
                            disabled={busyForm === `student-delete-${student.id}`}
                            onClick={() => setConfirmingDeleteStudentId(student.id)}
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="admin-table__empty" colSpan="5">
                      Talaba topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(studentPagination.currentPage, studentPagination.totalPages, setStudentPage)}
        </article>

        {isStudentFormOpen ? (
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onClick={() => {
              setIsStudentFormOpen(false);
              setEditingStudentId(null);
              setStudentForm(initialStudentForm);
            }}
          >
            <article
              className="panel-card admin-modal"
              role="dialog"
              aria-modal="true"
              aria-label={editingStudentId ? "Talabani tahrirlash" : "Talaba qo'shish"}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-head">
                <div>
                  <span className="section-kicker">
                    {editingStudentId ? "Edit Student" : "New Student"}
                  </span>
                  <h2>{editingStudentId ? "Talabani tahrirlash" : "Talaba qo'shish"}</h2>
                </div>
              </div>

              <form className="form-stack" onSubmit={handleStudentSubmit}>
                <label className="field">
                  <span>Guruh</span>
                  <select
                    value={studentForm.groupId}
                    onChange={(event) =>
                      setStudentForm({ ...studentForm, groupId: event.target.value })
                    }
                  >
                    <option value="">Biriktirilmagan</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Talaba ismi</span>
                  <input
                    value={studentForm.name}
                    onChange={(event) =>
                      setStudentForm({ ...studentForm, name: event.target.value })
                    }
                    placeholder="To'liq ism sharif"
                    required
                  />
                </label>
                <label className="field">
                  <span>Telefon</span>
                  <input
                    value={studentForm.phone}
                    onChange={(event) =>
                      setStudentForm({
                        ...studentForm,
                        phone: formatPhoneInput(event.target.value)
                      })
                    }
                    placeholder="+998-90-123-45-67"
                    required
                  />
                </label>
                <label className="field">
                  <span>Parol</span>
                  <input
                    value={studentForm.password}
                    onChange={(event) =>
                      setStudentForm({ ...studentForm, password: event.target.value })
                    }
                    placeholder="Kamida 4 ta belgi"
                    required
                  />
                </label>
                <div className="admin-group-form__actions">
                  <button className="primary-button" type="submit" disabled={busyForm === "student"}>
                    {busyForm === "student"
                      ? "Saqlanmoqda..."
                      : editingStudentId
                        ? "Saqlash"
                        : "Talaba qo'shish"}
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      setIsStudentFormOpen(false);
                      setEditingStudentId(null);
                      setStudentForm(initialStudentForm);
                    }}
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </article>
          </div>
        ) : null}

        {viewingStudent ? (
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onClick={() => setViewingStudentId(null)}
          >
            <article
              className="panel-card admin-modal admin-modal--wide"
              role="dialog"
              aria-modal="true"
              aria-label="Talaba ma'lumoti"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-head">
                <div>
                  <span className="section-kicker">Student View</span>
                  <h2>{viewingStudent.name}</h2>
                </div>
              </div>

              <div className="admin-modal-tabs">
                <button
                  className={`admin-modal-tab${studentViewTab === "info" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setStudentViewTab("info")}
                >
                  Talaba ma'lumoti
                </button>
                <button
                  className={`admin-modal-tab${studentViewTab === "tests" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setStudentViewTab("tests")}
                >
                  Testlar
                </button>
                <button
                  className={`admin-modal-tab${studentViewTab === "results" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setStudentViewTab("results")}
                >
                  Natijalar
                </button>
              </div>

              {studentViewTab === "info" ? (
                <div className="admin-modal-section">
                  <div className="admin-modal-grid">
                    <article className="admin-modal-metric">
                      <span>Talaba</span>
                      <strong>{viewingStudent.name}</strong>
                    </article>
                    <article className="admin-modal-metric">
                      <span>Telefon</span>
                      <strong>{viewingStudent.phone}</strong>
                    </article>
                    <article className="admin-modal-metric">
                      <span>Guruh</span>
                      <strong>{viewingStudent.groupName}</strong>
                    </article>
                    <article className="admin-modal-metric">
                      <span>Parol</span>
                      <strong>{viewingStudent.password}</strong>
                    </article>
                  </div>
                </div>
              ) : null}

              {studentViewTab === "tests" ? (
                <div className="admin-modal-section">
                  {viewingStudentTests.length ? (
                    <div className="admin-modal-list">
                      {viewingStudentTests.map((test) => (
                        <article className="admin-modal-list__item" key={test.id}>
                          <strong>{test.title}</strong>
                          <span>{test.questionCount} savol</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="test-copy">Testlar yo'q</p>
                  )}
                </div>
              ) : null}

              {studentViewTab === "results" ? (
                <div className="admin-modal-section">
                  {viewingStudentResults.length ? (
                    <div className="admin-modal-list">
                      {viewingStudentResults.map((result) => (
                        <article className="admin-modal-list__item" key={result.id}>
                          <strong>{result.testTitle}</strong>
                          <span>{result.scorePercent}% natija</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="test-copy">Natijalar yo'q</p>
                  )}
                </div>
              ) : null}
            </article>
          </div>
        ) : null}

        {confirmingDeleteStudent ? (
          <div
            className="admin-modal-backdrop"
            role="presentation"
            onClick={() => setConfirmingDeleteStudentId(null)}
          >
            <article
              className="panel-card admin-modal admin-confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Talabani o'chirishni tasdiqlash"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="admin-confirm-modal__badge">
                <DeleteIcon />
              </div>

              <div className="admin-confirm-modal__copy">
                <span className="section-kicker">Delete Student</span>
                <h2>{confirmingDeleteStudent.name} talabani o'chirish</h2>
                <p className="test-copy">
                  Bu amal talabaning test urinishlari va natijalarini ham o'chiradi.
                </p>
              </div>

              <div className="admin-modal-grid">
                <article className="admin-modal-metric">
                  <span>Guruh</span>
                  <strong>{confirmingDeleteStudent.groupName}</strong>
                </article>
                <article className="admin-modal-metric">
                  <span>Natijalar</span>
                  <strong>
                    {dashboard?.recentResults?.filter(
                      (result) => result.studentId === confirmingDeleteStudent.id
                    ).length}{" "}
                    ta
                  </strong>
                </article>
              </div>

              <div className="admin-group-form__actions admin-confirm-modal__actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setConfirmingDeleteStudentId(null)}
                >
                  Bekor qilish
                </button>
                <button
                  className="primary-button admin-confirm-modal__delete"
                  type="button"
                  disabled={busyForm === `student-delete-${confirmingDeleteStudent.id}`}
                  onClick={confirmStudentDelete}
                >
                  {busyForm === `student-delete-${confirmingDeleteStudent.id}`
                    ? "O'chirilmoqda..."
                    : "O'chirish"}
                </button>
              </div>
            </article>
          </div>
        ) : null}
      </section>
    );
  }

  function renderTestPageSimple() {
    if (isTestFormOpen) {
      return (
        <section className="teacher-page-stack teacher-page-stack--builder">
          <article className="panel-card panel-wide admin-test-builder-page admin-test-builder-page--flat">
            <div className="admin-test-builder-page__head">
              <div>
                <span className="section-kicker">New Test</span>
                <h2>Yangi test yaratish</h2>
                <p className="test-copy">
                  Avval test ma'lumotlarini kiriting, keyin savollarni qo'shing.
                </p>
              </div>

              <div className="admin-test-builder-page__actions">
                <button className="ghost-button" type="button" onClick={closeCreateTestPage}>
                  Ortga
                </button>
              </div>
            </div>

            <div className="admin-test-steps">
              <span className={`admin-test-step${testFormStep === 1 ? " is-active" : ""}`}>
                1. Ma'lumotlar
              </span>
              <span className={`admin-test-step${testFormStep === 2 ? " is-active" : ""}`}>
                2. Savollar
              </span>
            </div>

            {status.test ? (
              <p className={`inline-status ${status.test.type}`}>{status.test.message}</p>
            ) : null}

            {testFormStep === 1 ? (
              <div className="admin-test-stage">
                <div className="form-grid form-grid-two">
                  <label className="field">
                    <span>Test nomi</span>
                    <input
                      value={testForm.title}
                      onChange={(event) => setTestForm({ ...testForm, title: event.target.value })}
                      placeholder="Masalan, 3-mavzu nazorat testi"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Guruh</span>
                    <select
                      value={testForm.groupId}
                      onChange={(event) => setTestForm({ ...testForm, groupId: event.target.value })}
                      required
                    >
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Boshlanish vaqti</span>
                    <input
                      type="datetime-local"
                      value={testForm.startTime}
                      onChange={(event) => setTestForm({ ...testForm, startTime: event.target.value })}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Tugash vaqti</span>
                    <input
                      type="datetime-local"
                      value={testForm.endTime}
                      onChange={(event) => setTestForm({ ...testForm, endTime: event.target.value })}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Davomiyligi (daqiqa)</span>
                    <input
                      type="number"
                      min="1"
                      value={testForm.durationMinutes}
                      onChange={(event) =>
                        setTestForm({ ...testForm, durationMinutes: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="field field-full">
                    <span>Qisqacha izoh</span>
                    <textarea
                      rows="4"
                      value={testForm.description}
                      onChange={(event) => setTestForm({ ...testForm, description: event.target.value })}
                      placeholder="Talabaga ko'rinadigan izoh"
                    />
                  </label>
                </div>

                <div className="form-footer admin-test-stage__footer">
                  <button className="primary-button" type="button" onClick={goToTestQuestionStep}>
                    Keyingi
                  </button>
                </div>
              </div>
            ) : (
              <form className="admin-test-stage" onSubmit={handleTestSubmit}>
                <div className="field-full question-builder">
                  <div className="question-builder__head">
                    <strong>Savollar</strong>
                    <button className="ghost-button" type="button" onClick={addQuestion}>
                      Savol qo'shish
                    </button>
                  </div>

                  <div className="question-list">
                    {testForm.questions.map((question, index) => (
                      <article className="question-editor" key={question.key}>
                        <div className="question-editor__head">
                          <strong>{index + 1}-savol</strong>
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={() => removeQuestion(question.key)}
                          >
                            Olib tashlash
                          </button>
                        </div>

                        <label className="field">
                          <span>Savol matni</span>
                          <textarea
                            rows="2"
                            value={question.prompt}
                            onChange={(event) =>
                              updateQuestion(question.key, "prompt", event.target.value)
                            }
                            placeholder="Savol matnini yozing"
                            required
                          />
                        </label>

                        <div className="admin-question-image">
                          <label className="field">
                            <span>Rasm</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                void handleQuestionImageChange(
                                  question.key,
                                  event.target.files?.[0] || null
                                )
                              }
                            />
                          </label>

                          {question.image ? (
                            <div className="admin-question-image__preview">
                              <img src={question.image} alt={`${index + 1}-savol rasmi`} />
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={() => updateQuestion(question.key, "image", "")}
                              >
                                Rasmni olib tashlash
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <div className="question-builder__head admin-question-options__head">
                          <strong>Javob variantlari</strong>
                          <button
                            className="ghost-button"
                            type="button"
                            disabled={question.options.length >= MAX_TEST_OPTIONS}
                            onClick={() => addQuestionOption(question.key)}
                          >
                            Variant qo'shish
                          </button>
                        </div>

                        <div className="admin-question-options">
                          {question.options.map((option, optionIndex) => (
                            <div className="admin-question-option" key={option.id}>
                              <label className="field">
                                <span>{getOptionLabel(optionIndex)} variant</span>
                                <input
                                  value={option.text}
                                  onChange={(event) =>
                                    updateQuestionOption(question.key, option.id, event.target.value)
                                  }
                                  required
                                />
                              </label>

                              <button
                                className="ghost-button admin-question-option__remove"
                                type="button"
                                disabled={question.options.length <= 2}
                                onClick={() => removeQuestionOption(question.key, option.id)}
                              >
                                Olib tashlash
                              </button>
                            </div>
                          ))}
                        </div>

                        <label className="field">
                          <span>To'g'ri javob</span>
                          <select
                            value={question.correctOptionId}
                            onChange={(event) => updateQuestion(question.key, "correctOptionId", event.target.value)}
                          >
                            {question.options.map((option, optionIndex) => (
                              <option key={option.id} value={option.id}>
                                {getOptionLabel(optionIndex)} variant
                              </option>
                            ))}
                          </select>
                        </label>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="form-footer admin-test-stage__footer">
                  <button className="ghost-button" type="button" onClick={() => setTestFormStep(1)}>
                    Ortga
                  </button>
                  <button className="primary-button" type="submit" disabled={busyForm === "test"}>
                    {busyForm === "test" ? "Yaratilmoqda..." : "Testni saqlash"}
                  </button>
                </div>
              </form>
            )}
          </article>
        </section>
      );
    }

    return (
      <section className="teacher-page-stack">
        <article className="panel-card">
          <div className="admin-page-toolbar admin-page-toolbar--search">
            <label className="admin-search-field">
              <input
                className="admin-search-input"
                value={testSearchQuery}
                onChange={(event) => setTestSearchQuery(event.target.value)}
                placeholder="Testni izlash"
                type="search"
              />
            </label>
            <button
              className="primary-button admin-toolbar-button"
              type="button"
              disabled={!groups.length}
              onClick={openCreateTestModal}
            >
              + Test yaratish
            </button>
          </div>

          {status.test ? (
            <p className={`inline-status ${status.test.type}`}>{status.test.message}</p>
          ) : null}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Test</th>
                  <th>Guruh</th>
                  <th>Savollar</th>
                  <th>Vaqt</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {testPagination.items.length ? (
                  testPagination.items.map((test, index) => (
                    <tr key={test.id}>
                      <td>{(testPagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td>{test.title}</td>
                      <td>{test.groupName}</td>
                      <td>{test.questionCount} ta</td>
                      <td>{test.durationMinutes} daqiqa</td>
                      <td>
                        <span className="pill">{statusLabel(test.status)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="admin-table__empty" colSpan="6">
                      Test topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(testPagination.currentPage, testPagination.totalPages, setTestPage)}
        </article>
      </section>
    );
  }

  function renderResultsPage() {
    return (
      <article className="panel-card">
        <div className="panel-head">
          <div>
            <span className="section-kicker">Results</span>
            <h2>Oxirgi natijalar</h2>
          </div>
        </div>

        <div className="result-list">
          {recentResults.length ? (
            recentResults.map((result) => (
              <article className="result-card" key={result.id}>
                <div className="group-top">
                  <div>
                    <h3>{result.studentName}</h3>
                    <p>
                      {result.groupName} · {result.testTitle}
                    </p>
                  </div>
                  <span className="pill">{result.scorePercent}%</span>
                </div>
                <div className="meta-row">
                  <span>To'g'ri: {result.correctCount}</span>
                  <span>Xato: {result.wrongCount}</span>
                  <span>Bo'sh: {result.unansweredCount}</span>
                  <span>Vaqt: {result.timeSpentText}</span>
                </div>
                <div className="meta-row">
                  <span>{formatDateTime(result.submittedAt)}</span>
                </div>
              </article>
            ))
          ) : (
            <article className="test-card">
              <h3>Hali natijalar yo'q</h3>
              <p className="test-copy">
                Talabalar test topshirgach, yakuniy ko'rsatkichlar shu yerda paydo bo'ladi.
              </p>
            </article>
          )}
        </div>
      </article>
    );
  }

  function renderResultsPageSimple() {
    return (
      <section className="teacher-page-stack">
        <article className="panel-card">
          <div className="admin-page-toolbar admin-page-toolbar--search">
            <label className="admin-search-field">
              <input
                className="admin-search-input"
                value={resultSearchQuery}
                onChange={(event) => setResultSearchQuery(event.target.value)}
                placeholder={resultSearchPlaceholder}
                type="search"
              />
            </label>

            <div className="admin-results-actions">
              {selectedResultGroup ? (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setSelectedResultGroupKey("")}
                >
                  Guruhlarga qaytish
                </button>
              ) : null}

              {selectedResultTest ? (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setSelectedResultTestKey("")}
                >
                  Testlarga qaytish
                </button>
              ) : null}

              {selectedResultTest ? (
                <button
                  className="ghost-button"
                  type="button"
                  disabled={!filteredDetailedResults.length}
                  onClick={exportSelectedResultsToExcel}
                >
                  Excel yuklab olish
                </button>
              ) : null}

              {selectedResultTest ? (
                <button
                  className="primary-button"
                  type="button"
                  disabled={!filteredDetailedResults.length}
                  onClick={exportSelectedResultsToPdf}
                >
                  PDF yuklab olish
                </button>
              ) : null}
            </div>
          </div>

          {selectedResultGroup ? (
            <div className="admin-results-breadcrumb">
              <span className="pill">{selectedResultGroup.name}</span>
              {selectedResultTest ? <span className="pill">{selectedResultTest.title}</span> : null}
            </div>
          ) : null}

          {!selectedResultGroupKey ? (
            <div className="group-grid teacher-group-grid admin-results-grid">
              {resultPagination.items.length ? (
                resultPagination.items.map((group) => (
                  <button
                    className="group-card admin-result-card"
                    key={group.key}
                    type="button"
                    onClick={() => setSelectedResultGroupKey(group.key)}
                  >
                    <div className="group-top">
                      <div>
                        <h3>{group.name}</h3>
                        <p>{group.testCount} ta test topshirilgan</p>
                      </div>
                      <span className="pill">{group.resultCount} ta natija</span>
                    </div>

                    <div className="meta-row">
                      <span>O'rtacha: {group.averageScore}%</span>
                    </div>
                  </button>
                ))
              ) : (
                <article className="test-card">
                  <h3>Natija topilmadi</h3>
                  <p className="test-copy">Mos guruh topilmadi.</p>
                </article>
              )}
            </div>
          ) : null}

          {selectedResultGroupKey && !selectedResultTestKey ? (
            <div className="test-list teacher-test-list admin-results-grid">
              {resultPagination.items.length ? (
                resultPagination.items.map((test) => (
                  <button
                    className="test-card admin-result-card"
                    key={test.key}
                    type="button"
                    onClick={() => setSelectedResultTestKey(test.key)}
                  >
                    <div className="group-top">
                      <div>
                        <h3>{test.title}</h3>
                        <p>{test.studentCount} ta o'quvchi topshirgan</p>
                      </div>
                      <span className="pill">{test.resultCount} ta natija</span>
                    </div>

                    <div className="meta-row">
                      <span>O'rtacha: {test.averageScore}%</span>
                      <span>{formatDateTime(test.submittedAt)}</span>
                    </div>
                  </button>
                ))
              ) : (
                <article className="test-card">
                  <h3>Test topilmadi</h3>
                  <p className="test-copy">Tanlangan guruh uchun mos test topilmadi.</p>
                </article>
              )}
            </div>
          ) : null}

          {selectedResultTestKey ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Talaba</th>
                    <th>Natija</th>
                    <th>To'g'ri</th>
                    <th>Xato</th>
                    <th>Bo'sh</th>
                    <th>Vaqt</th>
                    <th>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {resultPagination.items.length ? (
                    resultPagination.items.map((result, index) => (
                      <tr key={result.id}>
                        <td>{(resultPagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td>{result.studentName}</td>
                        <td>{result.scorePercent}%</td>
                        <td>{result.correctCount}</td>
                        <td>{result.wrongCount}</td>
                        <td>{result.unansweredCount}</td>
                        <td>{result.timeSpentText}</td>
                        <td>{formatDateTime(result.submittedAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="admin-table__empty" colSpan="8">
                        O'quvchi natijasi topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          {renderPagination(resultPagination.currentPage, resultPagination.totalPages, setResultPage)}
        </article>
      </section>
    );
  }

  function renderCurrentPageContent() {
    if (currentPage === "overview") {
      return renderOverviewPage();
    }

    if (currentPage === "group") {
      return renderGroupPageSimple();
    }

    if (currentPage === "student") {
      return renderStudentPageSimple();
    }

    if (currentPage === "test" || currentPage === "tests") {
      return renderTestPageSimple();
    }

    return renderResultsPageSimple();
  }

  return (
    <section className="dashboard-shell crm-shell teacher-shell">
      <header className="teacher-header">
        <div className="teacher-header__brand">
          <div className="teacher-logo">AY</div>
          <div className="teacher-header__text">
            <strong>Aydos</strong>
            <small>Teacher Dashboard</small>
          </div>
        </div>

        <div className="teacher-header__actions">
          <span className="teacher-header__chip">
            {summary.studentCount} talaba · {summary.testCount} test
          </span>

          <div className="teacher-profile">
            <span className="teacher-profile__avatar">{profileInitials}</span>
            <div className="teacher-profile__meta">
              <strong>{profileName}</strong>
              <small>O'qituvchi</small>
            </div>
          </div>

          <button className="ghost-button teacher-header__logout" type="button" onClick={onLogout}>
            Chiqish
          </button>
        </div>
      </header>

      <aside className="crm-sidebar">
        <nav className="crm-nav">
          {navigationItems.map((item) => (
            <a
              className={`crm-nav-link${currentPage === item.key ? " is-active" : ""}`}
              href={`#${item.key}`}
              key={item.key}
            >
              <span className="crm-nav-link__icon">{item.icon}</span>
              <span className="crm-nav-link__body">
                <span>{item.label}</span>
                <small>{item.meta}</small>
              </span>
            </a>
          ))}
        </nav>

      </aside>

      <div className={`crm-main${isImmersiveTestBuilder ? " crm-main--builder" : ""}`}>
        {!isImmersiveTestBuilder ? (
        <header className="crm-main-header">
          <div className="dashboard-title">
            {!shouldSimplifyMainHeader ? (
              <span className="section-kicker">{currentPageMeta.kicker}</span>
            ) : null}
            <h1>{currentPageMeta.title}</h1>
            {!shouldSimplifyMainHeader ? <p>{currentPageMeta.description}</p> : null}
          </div>

          {!shouldSimplifyMainHeader ? (
            <div className="crm-highlight-grid">
              <article className="crm-highlight-card">
                <span>Holat</span>
                <strong>
                  {summary.studentCount} talaba, {summary.testCount} test, {summary.attemptCount} natija
                </strong>
              </article>
              <article className="crm-highlight-card">
                <span>O'qituvchi</span>
                <strong>{profileName}</strong>
              </article>
            </div>
          ) : null}
        </header>
        ) : null}

        {error ? <p className="banner error">{error}</p> : null}
        {isLoading ? <p className="banner info">Dashboard yangilanmoqda...</p> : null}

        {renderCurrentPageContent()}

        {/*
          <article className="panel-card crm-section-anchor" id="teacher-group">
            <div className="panel-head">
              <div>
                <span className="section-kicker">New Group</span>
                <h2>Guruh yaratish</h2>
              </div>
            </div>

            <form className="form-stack" onSubmit={handleGroupSubmit}>
              <label className="field">
                <span>Guruh nomi</span>
                <input
                  value={groupForm.name}
                  onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })}
                  placeholder="Masalan, Aydos 303"
                  required
                />
              </label>
              <label className="field">
                <span>Jadval</span>
                <input
                  value={groupForm.schedule}
                  onChange={(event) =>
                    setGroupForm({ ...groupForm, schedule: event.target.value })
                  }
                  placeholder="Du, Chor, Ju / 12:00"
                />
              </label>
              <label className="field">
                <span>Xona</span>
                <input
                  value={groupForm.room}
                  onChange={(event) => setGroupForm({ ...groupForm, room: event.target.value })}
                  placeholder="Xona 402"
                />
              </label>
              <button className="primary-button" type="submit" disabled={busyForm === "group"}>
                {busyForm === "group" ? "Saqlanmoqda..." : "Guruh yaratish"}
              </button>
              {status.group ? (
                <p className={`inline-status ${status.group.type}`}>{status.group.message}</p>
              ) : null}
            </form>
          </article>

          <article className="panel-card crm-section-anchor" id="teacher-student">
            <div className="panel-head">
              <div>
                <span className="section-kicker">New Student</span>
                <h2>Talaba qo'shish</h2>
              </div>
            </div>

            <form className="form-stack" onSubmit={handleStudentSubmit}>
              <label className="field">
                <span>Guruh</span>
                <select
                  value={studentForm.groupId}
                  onChange={(event) =>
                    setStudentForm({ ...studentForm, groupId: event.target.value })
                  }
                  required
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Talaba ismi</span>
                <input
                  value={studentForm.name}
                  onChange={(event) =>
                    setStudentForm({ ...studentForm, name: event.target.value })
                  }
                  placeholder="To'liq ism sharif"
                  required
                />
              </label>
              <label className="field">
                <span>Telefon</span>
                <input
                  value={studentForm.phone}
                  onChange={(event) =>
                    setStudentForm({
                      ...studentForm,
                      phone: formatPhoneInput(event.target.value)
                    })
                  }
                  placeholder="+998-90-123-45-67"
                  required
                />
              </label>
              <label className="field">
                <span>Parol</span>
                <input
                  value={studentForm.password}
                  onChange={(event) =>
                    setStudentForm({ ...studentForm, password: event.target.value })
                  }
                  placeholder="Kamida 4 ta belgi"
                  required
                />
              </label>
              <button className="primary-button" type="submit" disabled={busyForm === "student"}>
                {busyForm === "student" ? "Qo'shilmoqda..." : "Talaba yaratish"}
              </button>
              {status.student ? (
                <p className={`inline-status ${status.student.type}`}>{status.student.message}</p>
              ) : null}
            </form>
          </article>

          <article className="panel-card panel-wide crm-section-anchor" id="teacher-test">
            <div className="panel-head">
              <div>
                <span className="section-kicker">New Test</span>
                <h2>Test yaratish va guruhga biriktirish</h2>
              </div>
            </div>

            <form className="form-grid form-grid-two" onSubmit={handleTestSubmit}>
              <label className="field">
                <span>Test nomi</span>
                <input
                  value={testForm.title}
                  onChange={(event) => setTestForm({ ...testForm, title: event.target.value })}
                  placeholder="Masalan, 3-mavzu nazorat testi"
                  required
                />
              </label>
              <label className="field">
                <span>Guruh</span>
                <select
                  value={testForm.groupId}
                  onChange={(event) => setTestForm({ ...testForm, groupId: event.target.value })}
                  required
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Boshlanish vaqti</span>
                <input
                  type="datetime-local"
                  value={testForm.startTime}
                  onChange={(event) =>
                    setTestForm({ ...testForm, startTime: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field">
                <span>Tugash vaqti</span>
                <input
                  type="datetime-local"
                  value={testForm.endTime}
                  onChange={(event) => setTestForm({ ...testForm, endTime: event.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Davomiyligi (daqiqa)</span>
                <input
                  type="number"
                  min="1"
                  value={testForm.durationMinutes}
                  onChange={(event) =>
                    setTestForm({ ...testForm, durationMinutes: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field field-full">
                <span>Qisqacha izoh</span>
                <textarea
                  rows="3"
                  value={testForm.description}
                  onChange={(event) =>
                    setTestForm({ ...testForm, description: event.target.value })
                  }
                  placeholder="Talabaga ko'rinadigan izoh"
                />
              </label>

              <div className="field-full question-builder">
                <div className="question-builder__head">
                  <strong>Savollar</strong>
                  <button className="ghost-button" type="button" onClick={addQuestion}>
                    Savol qo'shish
                  </button>
                </div>

                <div className="question-list">
                  {testForm.questions.map((question, index) => (
                    <article className="question-editor" key={question.key}>
                      <div className="question-editor__head">
                        <strong>{index + 1}-savol</strong>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => removeQuestion(question.key)}
                        >
                          Olib tashlash
                        </button>
                      </div>

                      <label className="field">
                        <span>Savol matni</span>
                        <textarea
                          rows="2"
                          value={question.prompt}
                          onChange={(event) =>
                            updateQuestion(question.key, "prompt", event.target.value)
                          }
                          placeholder="Savol matnini yozing"
                          required
                        />
                      </label>

                      <div className="question-options-grid">
                        <label className="field">
                          <span>A variant</span>
                          <input
                            value={question.optionA}
                            onChange={(event) =>
                              updateQuestion(question.key, "optionA", event.target.value)
                            }
                            required
                          />
                        </label>
                        <label className="field">
                          <span>B variant</span>
                          <input
                            value={question.optionB}
                            onChange={(event) =>
                              updateQuestion(question.key, "optionB", event.target.value)
                            }
                            required
                          />
                        </label>
                        <label className="field">
                          <span>C variant</span>
                          <input
                            value={question.optionC}
                            onChange={(event) =>
                              updateQuestion(question.key, "optionC", event.target.value)
                            }
                            required
                          />
                        </label>
                        <label className="field">
                          <span>D variant</span>
                          <input
                            value={question.optionD}
                            onChange={(event) =>
                              updateQuestion(question.key, "optionD", event.target.value)
                            }
                            required
                          />
                        </label>
                      </div>

                      <label className="field">
                        <span>To'g'ri javob</span>
                        <select
                          value={question.correctOptionId}
                          onChange={(event) =>
                            updateQuestion(question.key, "correctOptionId", event.target.value)
                          }
                        >
                          <option value="a">A variant</option>
                          <option value="b">B variant</option>
                          <option value="c">C variant</option>
                          <option value="d">D variant</option>
                        </select>
                      </label>
                    </article>
                  ))}
                </div>
              </div>

              <div className="field-full form-footer">
                <button className="primary-button" type="submit" disabled={busyForm === "test"}>
                  {busyForm === "test" ? "Yaratilmoqda..." : "Testni saqlash"}
                </button>
                {status.test ? (
                  <p className={`inline-status ${status.test.type}`}>{status.test.message}</p>
                ) : null}
              </div>
            </form>
          </article>

          <article className="panel-card panel-wide crm-section-anchor" id="teacher-groups">
            <div className="panel-head">
              <div>
                <span className="section-kicker">Groups</span>
                <h2>Guruhlar va talabalar</h2>
              </div>
            </div>

            <div className="group-grid teacher-group-grid">
              {groups.map((group) => (
                <section className="group-card" key={group.id}>
                  <div className="group-top">
                    <div>
                      <h3>{group.name}</h3>
                      <p>{group.schedule}</p>
                    </div>
                    <span className="pill">{group.students.length} talaba</span>
                  </div>

                  <div className="meta-row">
                    <span>{group.room}</span>
                  </div>

                  <div className="student-list">
                    {group.students.map((student) => (
                      <article className="student-card" key={student.id}>
                        <div>
                          <strong>{student.name}</strong>
                          <p>{student.phone}</p>
                        </div>
                        <div className="meta-row meta-row-tight">
                          <span>Parol: {student.password}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <article className="panel-card panel-wide crm-section-anchor" id="teacher-tests">
            <div className="panel-head">
              <div>
                <span className="section-kicker">Tests</span>
                <h2>Yaratilgan testlar</h2>
              </div>
            </div>

            <div className="test-list teacher-test-list">
              {tests.map((test) => (
                <article className="test-card" key={test.id}>
                  <div className="group-top">
                    <div>
                      <h3>{test.title}</h3>
                      <p>{test.groupName}</p>
                    </div>
                    <span className="pill">{statusLabel(test.status)}</span>
                  </div>
                  <p className="test-copy">{test.description}</p>
                  <div className="meta-row">
                    <span>{test.questionCount} ta savol</span>
                    <span>{test.durationMinutes} daqiqa</span>
                    <span>{test.attemptCount} ta topshirish</span>
                    <span>O'rtacha {test.averageScore}%</span>
                  </div>
                  <div className="meta-row">
                    <span>{formatDateTime(test.startTime)}</span>
                    <span>{formatDateTime(test.endTime)}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="panel-card panel-wide crm-section-anchor" id="teacher-results">
            <div className="panel-head">
              <div>
                <span className="section-kicker">Results</span>
                <h2>Oxirgi natijalar</h2>
              </div>
            </div>

            <div className="result-list">
              {recentResults.length ? (
                recentResults.map((result) => (
                  <article className="result-card" key={result.id}>
                    <div className="group-top">
                      <div>
                        <h3>{result.studentName}</h3>
                        <p>
                          {result.groupName} · {result.testTitle}
                        </p>
                      </div>
                      <span className="pill">{result.scorePercent}%</span>
                    </div>
                    <div className="meta-row">
                      <span>To'g'ri: {result.correctCount}</span>
                      <span>Xato: {result.wrongCount}</span>
                      <span>Bo'sh: {result.unansweredCount}</span>
                      <span>Vaqt: {result.timeSpentText}</span>
                    </div>
                    <div className="meta-row">
                      <span>{formatDateTime(result.submittedAt)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <article className="test-card">
                  <h3>Hali natijalar yo'q</h3>
                  <p className="test-copy">
                    Talabalar test topshirgach, yakuniy ko'rsatkichlar shu yerda paydo bo'ladi.
                  </p>
                </article>
              )}
            </div>
          </article>
        </section>
        */}
      </div>
    </section>
  );
}

export default AdminDashboard;
