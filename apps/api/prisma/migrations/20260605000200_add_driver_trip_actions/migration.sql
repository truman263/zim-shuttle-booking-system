DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TripActionType') THEN
    CREATE TYPE "TripActionType" AS ENUM ('START_TRIP', 'COMPLETE_TRIP', 'REPORT_ISSUE');
  END IF;
END $$;

CREATE TABLE "DriverTripToken" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DriverTripToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripActionLog" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "action" "TripActionType" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TripActionLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DriverTripToken_tokenHash_key" ON "DriverTripToken"("tokenHash");
CREATE INDEX "DriverTripToken_bookingId_idx" ON "DriverTripToken"("bookingId");
CREATE INDEX "DriverTripToken_driverId_idx" ON "DriverTripToken"("driverId");
CREATE INDEX "DriverTripToken_companyId_idx" ON "DriverTripToken"("companyId");
CREATE INDEX "DriverTripToken_expiresAt_idx" ON "DriverTripToken"("expiresAt");
CREATE INDEX "TripActionLog_bookingId_idx" ON "TripActionLog"("bookingId");
CREATE INDEX "TripActionLog_driverId_idx" ON "TripActionLog"("driverId");
CREATE INDEX "TripActionLog_companyId_idx" ON "TripActionLog"("companyId");
CREATE INDEX "TripActionLog_action_idx" ON "TripActionLog"("action");

ALTER TABLE "DriverTripToken" ADD CONSTRAINT "DriverTripToken_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DriverTripToken" ADD CONSTRAINT "DriverTripToken_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DriverTripToken" ADD CONSTRAINT "DriverTripToken_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripActionLog" ADD CONSTRAINT "TripActionLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripActionLog" ADD CONSTRAINT "TripActionLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripActionLog" ADD CONSTRAINT "TripActionLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
