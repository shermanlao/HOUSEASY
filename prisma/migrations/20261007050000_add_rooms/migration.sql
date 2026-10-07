-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One room per existing property (name from property name or Chinese address)
INSERT INTO "Room" ("id", "name", "monthlyRent", "propertyId", "createdAt", "updatedAt")
SELECT
    'mig_' || "id",
    CASE WHEN "name" <> '' THEN "name" ELSE "addressChinese" END,
    "monthlyRent",
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Property";

-- Tenant: propertyId -> roomId
ALTER TABLE "Tenant" ADD COLUMN "roomId" TEXT;

UPDATE "Tenant" AS t
SET "roomId" = r."id"
FROM "Room" AS r
WHERE r."propertyId" = t."propertyId";

ALTER TABLE "Tenant" ALTER COLUMN "roomId" SET NOT NULL;
ALTER TABLE "Tenant" DROP CONSTRAINT "Tenant_propertyId_fkey";
ALTER TABLE "Tenant" DROP COLUMN "propertyId";
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Statement: propertyId -> roomId
ALTER TABLE "Statement" ADD COLUMN "roomId" TEXT;

UPDATE "Statement" AS s
SET "roomId" = r."id"
FROM "Room" AS r
WHERE r."propertyId" = s."propertyId";

ALTER TABLE "Statement" ALTER COLUMN "roomId" SET NOT NULL;
ALTER TABLE "Statement" DROP CONSTRAINT "Statement_propertyId_fkey";
ALTER TABLE "Statement" DROP COLUMN "propertyId";
ALTER TABLE "Statement" ADD CONSTRAINT "Statement_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Monthly rent now lives on Room
ALTER TABLE "Property" DROP COLUMN "monthlyRent";
