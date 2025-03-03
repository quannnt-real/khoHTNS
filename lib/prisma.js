import { PrismaClient } from '@prisma/client';

// Tránh tạo nhiều instances trong development
const prisma = global.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma };