-- CreateTable
CREATE TABLE "CompanyPricingSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customRouteAutoEstimateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customRouteBaseFare" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "customRoutePricePerKm" DECIMAL(65,30) NOT NULL DEFAULT 1.2,
    "customRouteMinimumFare" DECIMAL(65,30) NOT NULL DEFAULT 15,
    "customRouteManualQuoteThresholdKm" DECIMAL(65,30),
    "depositRequired" BOOLEAN NOT NULL DEFAULT true,
    "depositPercentage" DECIMAL(65,30) NOT NULL DEFAULT 30,
    "minimumDepositAmount" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "configuredAt" TIMESTAMP(3),
    "configuredByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyPricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingChangeLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "changedByAdminId" TEXT,
    "changeType" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPricingSettings_companyId_key" ON "CompanyPricingSettings"("companyId");

-- CreateIndex
CREATE INDEX "PricingChangeLog_companyId_createdAt_idx" ON "PricingChangeLog"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "CompanyPricingSettings" ADD CONSTRAINT "CompanyPricingSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPricingSettings" ADD CONSTRAINT "CompanyPricingSettings_configuredByAdminId_fkey" FOREIGN KEY ("configuredByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingChangeLog" ADD CONSTRAINT "PricingChangeLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingChangeLog" ADD CONSTRAINT "PricingChangeLog_changedByAdminId_fkey" FOREIGN KEY ("changedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
