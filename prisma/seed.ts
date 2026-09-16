import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rentaleasy.local' },
    update: {},
    create: {
      email: 'admin@rentaleasy.local',
      name: '管理員',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@rentaleasy.local' },
    update: {},
    create: {
      email: 'owner@rentaleasy.local',
      name: '業主範例',
      passwordHash: ownerPassword,
      role: 'OWNER',
    },
  });

  let property = await prisma.property.findFirst({
    where: { addressChinese: '彌敦道379號金勳大樓15樓07室 (C)房' },
  });
  if (!property) {
    property = await prisma.property.create({
      data: {
        name: '金勳大樓15樓07室 (C)房',
        addressChinese: '彌敦道379號金勳大樓15樓07室 (C)房',
        addressEnglish: '379 NATHAN RD HONOUR HOUSE 14/F FLAT 07 (RM C)',
        monthlyRent: 6500,
      },
    });
  }

  const existingOwner = await prisma.propertyOwner.findUnique({
    where: { userId_propertyId: { userId: owner.id, propertyId: property.id } },
  });
  if (!existingOwner) {
    await prisma.propertyOwner.create({
      data: { userId: owner.id, propertyId: property.id },
    });
  }

  let tenant = await prisma.tenant.findFirst({
    where: { propertyId: property.id, nameChinese: '陳鷺思' },
  });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        nameChinese: '陳鷺思',
        nameEnglish: 'CHAN, Lo Sze Celia',
        phone: '6056 0546',
        passportOrHkid: 'A1234567',
        propertyId: property.id,
      },
    });
  }

  const existingStatement = await prisma.statement.findFirst({
    where: {
      propertyId: property.id,
      tenantId: tenant.id,
      periodStart: new Date('2026-01-01'),
    },
  });

  if (existingStatement) {
    console.log('Seed already applied, skipping statement/receipt creation');
    return;
  }

  const statement = await prisma.statement.create({
    data: {
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-31'),
      propertyId: property.id,
      tenantId: tenant.id,
      billings: {
        create: [
          {
            issueDate: new Date('2026-01-23'),
            title: '電費',
            qty: 108,
            unitRate: 1.8,
            lastReading: 25573,
            thisReading: 25681,
            placement: 1,
          },
          {
            issueDate: new Date('2026-01-23'),
            title: '水費',
            qty: 5,
            unitRate: 16,
            lastReading: 950,
            thisReading: 955,
            placement: 2,
          },
        ],
      },
      rentings: {
        create: [
          {
            lastPaymentDate: new Date('2026-01-15'),
            openingBalance: 6817.4,
            paymentReceived: 6818,
            placement: 1,
          },
        ],
      },
    },
  });

  await prisma.receipt.create({
    data: {
      paymentDate: new Date('2026-01-15'),
      amountReceived: 6818,
      statementId: statement.id,
    },
  });

  console.log('Seed completed:', { admin: admin.email, owner: owner.email, property: property.id, tenant: tenant.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
