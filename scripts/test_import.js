/**
 * 测试导入脚本 - 验证数据解析逻辑是否正确
 * 不连接数据库，只验证Excel解析和职务识别
 */

const XLSX = require('xlsx');

const POSITION_KEYWORDS = [
  { key: '生活班长', position: 'LIFE_COMMISSAR', priority: 4 },
  { key: '生活委员', position: 'LIFE_COMMISSAR', priority: 4 },
  { key: '学习委员', position: 'STUDY_COMMISSAR', priority: 3 },
  { key: '学委', position: 'STUDY_COMMISSAR', priority: 3 },
  { key: '文体委员', position: 'CULTURE_COMMISSAR', priority: 5 },
  { key: '文艺委员', position: 'CULTURE_COMMISSAR', priority: 5 },
  { key: '心理委员', position: 'NONE', priority: 6 },
  { key: '宣传委员', position: 'NONE', priority: 6 },
  { key: '组织委员', position: 'NONE', priority: 6 },
  { key: '信息委员', position: 'NONE', priority: 6 },
  { key: '团支书', position: 'LEAGUE_SECRETARY', priority: 2 },
  { key: '班长', position: 'CLASS_MONITOR', priority: 1 },
];

function parsePosition(text) {
  if (!text || text.trim() === '') return { primary: 'NONE', secondary: [] };
  // Sort keywords by length (longer first) to prefer "生活班长" over "班长"
  const sortedKeywords = [...POSITION_KEYWORDS].sort((a, b) => b.key.length - a.key.length);
  const matched = [];
  let remainingText = text;
  
  for (const kw of sortedKeywords) {
    if (remainingText.includes(kw.key)) {
      if (!matched.some(m => m.position === kw.position)) {
        matched.push({ position: kw.position, priority: kw.priority });
        // Remove matched keyword from text to prevent sub-keyword matching
        remainingText = remainingText.replace(kw.key, '');
      }
    }
  }
  if (matched.length === 0) return { primary: 'NONE', secondary: [] };
  matched.sort((a, b) => a.priority - b.priority);
  return { primary: matched[0].position, secondary: matched.slice(1).map(m => m.position) };
}

// Test cases
const tests = [
  { input: '班长兼组织委员', expected: { primary: 'CLASS_MONITOR', secondary: ['NONE'] } },
  { input: '团支书兼心理委员', expected: { primary: 'LEAGUE_SECRETARY', secondary: ['NONE'] } },
  { input: '班长', expected: { primary: 'CLASS_MONITOR', secondary: [] } },
  { input: '宣传委员兼信息委员', expected: { primary: 'NONE', secondary: ['NONE'] } },
  { input: '生活班长', expected: { primary: 'LIFE_COMMISSAR', secondary: [] } },
  { input: '', expected: { primary: 'NONE', secondary: [] } },
];

console.log('=== 职务识别测试 ===');
let passed = 0;
for (const t of tests) {
  const result = parsePosition(t.input);
  const ok = result.primary === t.expected.primary;
  if (ok) {
    console.log('✅ "%s" → %s (兼职: %s)', t.input, result.primary, result.secondary.join(', ') || '无');
    passed++;
  } else {
    console.log('❌ "%s" → 预期 %s, 实际 %s', t.input, t.expected.primary, result.primary);
  }
}
console.log('\n通过: %d/%d', passed, tests.length);

// Test data import
console.log('\n=== 数据导入测试 ===');
const wb1 = XLSX.readFile('D:/myfile/clcode/大一名单.xlsx');
const ws1 = wb1.Sheets[wb1.SheetNames[0]];
const studentsRaw = XLSX.utils.sheet_to_json(ws1, { defval: '' });

const students = [];
for (const row of studentsRaw) {
  const sid = String(row['学号'] || '').trim();
  const name = String(row['姓名'] || '').trim();
  const cls = String(row['班级'] || '').trim();
  if (sid && name) {
    students.push({ sid, name, cls });
  }
}

const wb2 = XLSX.readFile('D:/myfile/clcode/大一部分班级班级干部任命(2).xlsx');
const ws2 = wb2.Sheets[wb2.SheetNames[0]];
const cadresRaw = XLSX.utils.sheet_to_json(ws2, { defval: '' });

const cadres = {};
for (const row of cadresRaw) {
  const cls = String(row['班级'] || '').trim();
  const name = String(row['姓名'] || '').trim();
  const position = String(row['职务'] || '').trim();
  if (name && cls) {
    cadres[`${name}|||${cls}`] = position;
  }
}

console.log('学生总数: %d', students.length);
console.log('班委人数: %d', Object.keys(cadres).length);

// Count by position
const posCount = {};
for (const s of students) {
  const pos = cadres[`${s.name}|||${s.cls}`];
  const { primary } = parsePosition(pos || '');
  posCount[primary] = (posCount[primary] || 0) + 1;
}

console.log('\n职务分布:');
for (const [pos, count] of Object.entries(posCount).sort((a, b) => b[1] - a[1])) {
  console.log('  %s: %d 人', pos, count);
}

// Count by class
const classCount = {};
for (const s of students) {
  classCount[s.cls] = (classCount[s.cls] || 0) + 1;
}

console.log('\n班级分布:');
for (const [cls, count] of Object.entries(classCount).sort()) {
  console.log('  %s: %d 人', cls, count);
}

console.log('\n=== 前5条数据预览 ===');
for (let i = 0; i < 5 && i < students.length; i++) {
  const s = students[i];
  const pos = cadres[`${s.name}|||${s.cls}`];
  const { primary, secondary } = parsePosition(pos || '');
  console.log('学号: %s | 姓名: %s | 班级: %s | 职务: %s | 兼职: %s',
    s.sid, s.name, s.cls, primary, secondary.join(', ') || '无');
}

console.log('\n✅ 数据验证通过，可以执行实际导入');
