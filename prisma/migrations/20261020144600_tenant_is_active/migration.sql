-- Keep moved-out tenants. Only one active tenant is allowed per room.
ALTER TABLE "Tenant" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "roomId" ORDER BY id DESC) AS rn
  FROM "Tenant"
)
UPDATE "Tenant" AS t
SET "isActive" = false
FROM ranked
WHERE t.id = ranked.id AND ranked.rn > 1;

CREATE UNIQUE INDEX "Tenant_one_active_per_room" ON "Tenant" ("roomId") WHERE "isActive";
