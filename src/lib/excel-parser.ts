import * as XLSX from "xlsx";

const POSITION_KEYWORDS = [
  { key: '生活班长', position: 'LIFE_COMMISSAR' as const, priority: 4 },
  { key: '生活委员', position: 'LIFE_COMMISSAR' as const, priority: 4 },
  { key: '学习委员', position: 'STUDY_COMMISSAR' as const, priority: 3 },
  { key: '学委', position: 'STUDY_COMMISSAR' as const, priority: 3 },
  { key: '文体委员', position: 'CULTURE_COMMISSAR' as const, priority: 5 },
  { key: '文艺委员', position: 'CULTURE_COMMISSAR' as const, priority: 5 },
  { key: '宣传委员', position: 'PROPAGANDA' as const, priority: 6 },
  { key: '心理委员', position: 'PSYCHOLOGY' as const, priority: 7 },
  { key: '组织委员', position: 'ORGANIZATION' as const, priority: 8 },
  { key: '信息委员', position: 'INFO' as const, priority: 9 },
  { key: '团支书', position: 'LEAGUE_SECRETARY' as const, priority: 2 },
  { key: '班长', position: 'CLASS_MONITOR' as const, priority: 1 },
];

export function parsePosition(text: string): {
  primary: string;
  secondary: string[];
} {
  if (!text || text.trim() === "") {
    return { primary: "NONE", secondary: [] };
  }

  const sortedKeywords = [...POSITION_KEYWORDS].sort((a, b) => b.key.length - a.key.length);

  const matched: Array<{ position: string; priority: number }> = [];
  let remainingText = text;

  for (const keyword of sortedKeywords) {
    if (remainingText.includes(keyword.key)) {
      if (!matched.some((m) => m.position === keyword.position)) {
        matched.push({ position: keyword.position, priority: keyword.priority });
        remainingText = remainingText.replace(keyword.key, '');
      }
    }
  }

  if (matched.length === 0) {
    return { primary: "NONE", secondary: [] };
  }

  matched.sort((a, b) => a.priority - b.priority);

  return {
    primary: matched[0].position,
    secondary: matched.slice(1).map((m) => m.position),
  };
}

const COLUMN_PATTERNS: Record<string, string[]> = {
  name: ["姓名", "名字", "名称"],
  studentId: ["学号", "学工号", "工号", "账号"],
  className: ["班级", "班", "所在班级"],
  grade: ["年级", "入学年份"],
  position: ["职务", "班委职务", "职位", "担任职务", "学生干部职务"],
  phone: ["手机", "手机号", "电话", "联系电话", "手机号码"],
  email: ["邮箱", "电子邮件", "email"],
};

export function matchColumnName(header: string): string | null {
  const trimmed = header.trim();
  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (const pattern of patterns) {
      if (trimmed.includes(pattern)) {
        return field;
      }
    }
  }
  return null;
}

export function parseExcelFile(
  buffer: Buffer
): {
  headers: string[];
  rows: Array<Record<string, string>>;
  totalRows: number;
} {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  const headers = Object.keys(rawData[0] || {});
  const rows = rawData.map((row) => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      result[key] = String(value ?? "").trim();
    }
    return result;
  });

  return {
    headers,
    rows,
    totalRows: rows.length,
  };
}

export function validateStudentRow(
  rawRow: Record<string, string>,
  rowIndex: number
): {
  success: boolean;
  data?: {
    name: string;
    studentId: string;
    className: string;
    grade: number | null;
    primaryPosition: string;
    secondaryPositions: string;
    phone: string;
  };
  error?: string;
} {
  const mapped: Record<string, string> = {};
  for (const [header, value] of Object.entries(rawRow)) {
    const field = matchColumnName(header);
    if (field) {
      mapped[field] = value;
    }
  }

  const name = mapped.name?.trim();
  if (!name) {
    return { success: false, error: "姓名为空" };
  }

  const studentId = mapped.studentId?.trim();
  if (!studentId) {
    return { success: false, error: "学号为空" };
  }
  if (!/^\d{8,12}$/.test(studentId)) {
    return { success: false, error: `学号格式错误: ${studentId}` };
  }

  const className = mapped.className?.trim();
  if (!className) {
    return { success: false, error: "班级为空" };
  }

  let grade: number | null = null;
  const gradeStr = mapped.grade?.trim();
  if (gradeStr) {
    const parsed = parseInt(gradeStr, 10);
    if (!isNaN(parsed) && parsed >= 2020 && parsed <= 2030) {
      grade = parsed;
    }
  }

  const positionText = mapped.position?.trim() || "";
  const { primary, secondary } = parsePosition(positionText);

  return {
    success: true,
    data: {
      name,
      studentId,
      className,
      grade,
      primaryPosition: primary,
      secondaryPositions: secondary.join(","),
      phone: mapped.phone?.trim() || "",
    },
  };
}

export function parseAndValidateStudents(
  buffer: Buffer
): {
  totalRows: number;
  successRows: Array<{
    rowNumber: number;
    name: string;
    studentId: string;
    className: string;
    grade: number | null;
    primaryPosition: string;
    secondaryPositions: string;
    phone: string;
    rawPosition: string;
  }>;
  failedRows: Array<{
    rowNumber: number;
    name: string;
    studentId: string;
    className: string;
    position: string;
    error: string;
  }>;
} {
  const { rows } = parseExcelFile(buffer);

  const successRows: Array<{
    rowNumber: number;
    name: string;
    studentId: string;
    className: string;
    grade: number | null;
    primaryPosition: string;
    secondaryPositions: string;
    phone: string;
    rawPosition: string;
  }> = [];
  const failedRows: Array<{
    rowNumber: number;
    name: string;
    studentId: string;
    className: string;
    position: string;
    error: string;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;
    const result = validateStudentRow(row, rowNumber);

    if (result.success && result.data) {
      successRows.push({
        rowNumber,
        name: result.data.name,
        studentId: result.data.studentId,
        className: result.data.className,
        grade: result.data.grade,
        primaryPosition: result.data.primaryPosition,
        secondaryPositions: result.data.secondaryPositions,
        phone: result.data.phone,
        rawPosition: row["职务"] || row["班委职务"] || row["职位"] || "",
      });
    } else {
      failedRows.push({
        rowNumber,
        name: row["姓名"] || row["名字"] || "",
        studentId: row["学号"] || row["学工号"] || "",
        className: row["班级"] || row["班"] || "",
        position: row["职务"] || row["班委职务"] || row["职位"] || "",
        error: result.error || "未知错误",
      });
    }
  }

  return {
    totalRows: rows.length,
    successRows,
    failedRows,
  };
}
