// This is the seed file to populate the database with initial data.

// create a super admin if not exists; retrieve his credentials from env variables
// ADMIN_EMAIL
// ADMIN_PASSWORD
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const adminFirstname = process.env.SUPER_ADMIN_FIRSTNAME || 'Admin';
  const adminLastname = process.env.SUPER_ADMIN_LASTNAME || 'User';

  if (!adminEmail || !adminPassword) {
    console.warn(
      'SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in environment variables. Skipping super admin creation.',
    );
    return;
  }

  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstname,
      lastName: adminLastname,
      isActive: true,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log('Super admin ensured in the database.');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

console.log('Seeding completed successfully.');
