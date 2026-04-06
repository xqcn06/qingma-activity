/**
 * 大一学生数据导入脚本（最终版）
 * 支持班级名称模糊匹配（如"机械中美251" -> "机械(中外合作)251"）
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 班级名称映射表
const CLASS_NAME_MAP = {
  '机械中美251': '机械(中外合作)251',
  '机械中美252': '机械(中外合作)252',
  '机械中美253': '机械(中外合作)253',
};

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
  const sortedKeywords = [...POSITION_KEYWORDS].sort((a, b) => b.key.length - a.key.length);
  const matched = [];
  let remainingText = text;
  for (const kw of sortedKeywords) {
    if (remainingText.includes(kw.key)) {
      if (!matched.some(m => m.position === kw.position)) {
        matched.push({ position: kw.position, priority: kw.priority });
        remainingText = remainingText.replace(kw.key, '');
      }
    }
  }
  if (matched.length === 0) return { primary: 'NONE', secondary: [] };
  matched.sort((a, b) => a.priority - b.priority);
  return { primary: matched[0].position, secondary: matched.slice(1).map(m => m.position) };
}

function normalizeClassName(cls) {
  return CLASS_NAME_MAP[cls] || cls;
}

async function main() {
  console.log('📖 读取大一名单...');
  const wb1 = XLSX.readFile('D:/myfile/clcode/大一名单.xlsx');
  const ws1 = wb1.Sheets[wb1.SheetNames[0]];
  const studentsRaw = XLSX.utils.sheet_to_json(ws1, { defval: '' });
  
  const students = {};
  for (const row of studentsRaw) {
    const sid = String(row['学号'] || '').trim();
    const name = String(row['姓名'] || '').trim();
    const cls = String(row['班级'] || '').trim();
    if (sid && name) {
      students[`${name}|||${cls}`] = { sid, name, cls };
    }
  }
  
  console.log('📖 读取班委任职情况...');
  const wb2 = XLSX.readFile('D:/myfile/clcode/大一部分班级班级干部任命(2) copy.xlsx');
  const ws2 = wb2.Sheets[wb2.SheetNames[0]];
  const cadresRaw = XLSX.utils.sheet_to_json(ws2, { defval: '' });
  
  const cadres = [];
  for (const row of cadresRaw) {
    const cls = String(row['班级'] || '').trim();
    const name = String(row['姓名'] || '').trim();
    const position = String(row['职务'] || '').trim();
    if (name && cls) {
      cadres.push({ name, cls, position });
    }
  }
  
  console.log('🔍 匹配班委信息...');
  const matchedCadres = [];
  const unmatchedCadres = [];
  
  for (const cadre of cadres) {
    const key = `${cadre.name}|||${cadre.cls}`;
    if (students[key]) {
      matchedCadres.push({ ...cadre, sid: students[key].sid });
    } else {
      // Try fuzzy match with class name mapping
      const normalizedCls = normalizeClassName(cadre.cls);
      const normalizedKey = `${cadre.name}|||${normalizedCls}`;
      if (students[normalizedKey]) {
        matchedCadres.push({ ...cadre, cls: normalizedCls, sid: students[normalizedKey].sid });
      } else {
        unmatchedCadres.push(cadre);
      }
    }
  }
  
  console.log('✅ 成功匹配: %d/%d 人', matchedCadres.length, cadres.length);
  if (unmatchedCadres.length > 0) {
    console.log('⚠️  未匹配: %d 人', unmatchedCadres.length);
    for (const u of unmatchedCadres) {
      console.log('   - %s | %s | %s', u.name, u.cls, u.position);
    }
  }
  
  // Get existing student IDs
  console.log('\n🔍 检查已存在的学生...');
  const existingUsers = await prisma.user.findMany({
    select: { studentId: true },
  });
  const existingIds = new Set(existingUsers.map(u => u.studentId));
  
  // Build student data list
  const allStudents = [];
  for (const [key, student] of Object.entries(students)) {
    const cadre = matchedCadres.find(c => c.sid === student.sid);
    allStudents.push({
      ...student,
      position: cadre ? cadre.position : '',
      isCadre: !!cadre,
    });
  }
  
  const newStudents = allStudents.filter(s => !existingIds.has(s.sid));
  console.log('📝 需要导入: %d 人 (跳过 %d 人已存在)', newStudents.length, allStudents.length - newStudents.length);
  
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  // Batch create users
  console.log('\n📝 批量创建用户...');
  const batchSize = 50;
  let createdCount = 0;
  let cadreCount = 0;
  
  for (let i = 0; i < newStudents.length; i += batchSize) {
    const batch = newStudents.slice(i, i + batchSize);
    
    const createManyData = batch.map(s => {
      const { primary, secondary } = parsePosition(s.position);
      if (primary !== 'NONE') cadreCount++;
      
      return {
        name: s.name,
        studentId: s.sid,
        grade: 2025,
        className: s.cls,
        role: 'STUDENT',
        phone: '',
        password: hashedPassword,
        isFirstLogin: true,
      };
    });
    
    await prisma.user.createMany({
      data: createManyData,
      skipDuplicates: true,
    });
    
    createdCount += batch.length;
    console.log('  已创建 %d/%d 人', createdCount, newStudents.length);
  }
  
  console.log('\n✅ 导入完成！');
  console.log('  成功创建: %d 人', createdCount);
  console.log('  其中班委: %d 人', cadreCount);
  console.log('\n📌 学生需要自行登录网站确认报名');
  console.log('   登录账号: 学号');
  console.log('   初始密码: 123456');
  console.log('   首次登录强制修改密码');
  console.log('   登录后前往 /register 确认报名');
}

main()
  .catch((e) => {
    console.error('❌ 导入失败:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
