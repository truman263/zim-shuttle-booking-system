require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

const INVENTED_STAGING_ROUTE_IDS = [
  'lb-route-harare-mutare',
  'lb-route-harare-bulawayo',
  'lb-route-harare-masvingo',
  'lb-route-cbd-airport',
  'lb-route-airport-cbd',
];

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run the staging seed.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function archiveInventedRoute(routeId, archivedAt) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: {
      id: true,
      companyId: true,
      deletedAt: true,
    },
  });

  if (!route) {
    return { routeId, action: 'missing' };
  }

  if (route.companyId !== COMPANY_ID) {
    return { routeId, action: 'skipped-company-mismatch' };
  }

  await prisma.route.update({
    where: { id: routeId },
    data: {
      isActive: false,
      isDeleted: true,
      deletedAt: route.deletedAt ?? archivedAt,
    },
  });

  return { routeId, action: 'archived' };
}

async function main() {
  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: {
      name: 'LadyBird Shuttle Services',
      slug: 'ladybird-shuttle-services',
      email: 'info@ladybirdshuttles.co.zw',
      phone: '+263 77 361 5432',
      whatsapp: '+263 77 361 5432',
      logoUrl: '/brand/ladybird-logo.png',
      status: 'ACTIVE',
    },
    create: {
      id: COMPANY_ID,
      name: 'LadyBird Shuttle Services',
      slug: 'ladybird-shuttle-services',
      email: 'info@ladybirdshuttles.co.zw',
      phone: '+263 77 361 5432',
      whatsapp: '+263 77 361 5432',
      logoUrl: '/brand/ladybird-logo.png',
      status: 'ACTIVE',
    },
  });

  const archivedAt = new Date();
  const routeResults = [];

  for (const routeId of INVENTED_STAGING_ROUTE_IDS) {
    routeResults.push(await archiveInventedRoute(routeId, archivedAt));
  }

  console.log('Staging seed completed for LadyBird Shuttle Services.');
  console.log(`Company ID: ${COMPANY_ID}`);
  console.log('Owner-unapproved staging routes were archived/deactivated.');
  console.table(routeResults);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
