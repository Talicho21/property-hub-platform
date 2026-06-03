import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
try {
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users, null, 2));
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await prisma.();
}
