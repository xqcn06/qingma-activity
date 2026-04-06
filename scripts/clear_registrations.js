/**
 * 清除所有学生的自动报名记录
 * 保留用户账号，只删除报名记录
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 查询现有报名记录...');
  
  const count = await prisma.registration.count({
    where: {
      user: {
        role: 'STUDENT',
      },
    },
  });
  
  console.log('📝 找到 %d 条学生报名记录', count);
  
  if (count === 0) {
    console.log('✅ 无需清除');
    return;
  }
  
  console.log('🗑️  正在清除...');
  
  const result = await prisma.registration.deleteMany({
    where: {
      user: {
        role: 'STUDENT',
      },
    },
  });
  
  console.log('✅ 已删除 %d 条报名记录', result.count);
  console.log('\n📌 学生现在需要自行登录网站确认报名');
  console.log('   登录账号: 学号');
  console.log('   初始密码: 123456');
  console.log('   首次登录强制修改密码');
  console.log('   登录后前往 /register 确认报名');
}

main()
  .catch((e) => {
    console.error('❌ 清除失败:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
