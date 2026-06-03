require('dotenv/config');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const LADYBIRD_COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

function requiredEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`${name} is required to seed the admin user.`);
  }

  return value.trim();
}

async function main() {
  const databaseUrl = requiredEnv('DATABASE_URL');
  const adminEmail = requiredEnv('ADMIN_EMAIL').toLowerCase();
  const adminPassword = requiredEnv('ADMIN_PASSWORD');
  const adminFullName = requiredEnv('ADMIN_FULL_NAME');

  if (adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl,
    }),
  });

  try {
    await prisma.company.upsert({
      where: { id: LADYBIRD_COMPANY_ID },
      update: {
        name: 'LadyBird Shuttle Services',
        slug: 'ladybird-shuttle-services',
        status: 'TRIAL',
      },
      create: {
        id: LADYBIRD_COMPANY_ID,
        name: 'LadyBird Shuttle Services',
        slug: 'ladybird-shuttle-services',
        email: 'info@ladybirdshuttles.co.zw',
        phone: '+263 77 361 5432',
        whatsapp: '+263 77 361 5432',
        address: 'Zimbabwe',
        logoUrl: '',
        status: 'TRIAL',
      },
    });

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        companyId: LADYBIRD_COMPANY_ID,
        fullName: adminFullName,
        password: passwordHash,
        role: 'COMPANY_ADMIN',
        isActive: true,
      },
      create: {
        companyId: LADYBIRD_COMPANY_ID,
        fullName: adminFullName,
        email: adminEmail,
        password: passwordHash,
        role: 'COMPANY_ADMIN',
        isActive: true,
      },
    });

    console.log(`Admin user seeded for ${adminEmail}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
