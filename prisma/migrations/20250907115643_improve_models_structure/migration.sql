/*
  Warnings:

  - You are about to drop the column `failureReason` on the `Registration` table. All the data in the column will be lost.
  - You are about to drop the column `formationId` on the `Registration` table. All the data in the column will be lost.
  - You are about to drop the column `paymentAmount` on the `Registration` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `Registration` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `Registration` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[title]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,courseId]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `courseId` to the `Registration` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CASH', 'OTHER');

-- AlterEnum
ALTER TYPE "public"."RegistrationStatus" ADD VALUE 'COMPLETED';

-- DropForeignKey
ALTER TABLE "public"."Registration" DROP CONSTRAINT "Registration_formationId_fkey";

-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "location" TEXT,
ADD COLUMN     "objectives" TEXT,
ADD COLUMN     "prerequisites" TEXT;

-- AlterTable
ALTER TABLE "public"."Registration" DROP COLUMN "failureReason",
DROP COLUMN "formationId",
DROP COLUMN "paymentAmount",
DROP COLUMN "paymentDate",
DROP COLUMN "paymentId",
ADD COLUMN     "cancellationDate" TIMESTAMP(3),
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "confirmationDate" TIMESTAMP(3),
ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "remainingAmount" DOUBLE PRECISION,
ADD COLUMN     "totalAmount" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'OTHER',
    "transactionId" TEXT,
    "paymentDate" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "public"."Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_registrationId_idx" ON "public"."Payment"("registrationId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "public"."Payment"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "Course_title_key" ON "public"."Course"("title");

-- CreateIndex
CREATE INDEX "Course_isActive_idx" ON "public"."Course"("isActive");

-- CreateIndex
CREATE INDEX "Course_startDate_idx" ON "public"."Course"("startDate");

-- CreateIndex
CREATE INDEX "Course_price_idx" ON "public"."Course"("price");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_userId_courseId_key" ON "public"."Registration"("userId", "courseId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "public"."User"("isActive");

-- CreateIndex
CREATE INDEX "User_emailVerified_idx" ON "public"."User"("emailVerified");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Registration" ADD CONSTRAINT "Registration_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
