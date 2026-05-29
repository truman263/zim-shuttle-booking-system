-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Route_companyId_isDeleted_isActive_idx" ON "Route"("companyId", "isDeleted", "isActive");
