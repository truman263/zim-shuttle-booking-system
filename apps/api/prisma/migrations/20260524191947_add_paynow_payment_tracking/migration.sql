/*
  Warnings:

  - You are about to alter the column `durationDays` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `durationHours` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('MANUAL', 'PAYNOW');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'FULL_PAYMENT', 'BALANCE');

-- CreateEnum
CREATE TYPE "PaynowPaymentMethod" AS ENUM ('WEB', 'ECOCASH', 'ONEMONEY');

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "durationDays" SET DATA TYPE INTEGER,
ALTER COLUMN "durationHours" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "gateway" "PaymentGateway" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "gatewayReference" TEXT,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'DEPOSIT',
ADD COLUMN     "paynowPaymentMethod" "PaynowPaymentMethod",
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pollUrl" TEXT,
ADD COLUMN     "rawResponse" TEXT,
ADD COLUMN     "redirectUrl" TEXT;
