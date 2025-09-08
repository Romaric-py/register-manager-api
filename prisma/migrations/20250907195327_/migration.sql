/*
  Warnings:

  - You are about to drop the column `currentParticipants` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `maxParticipants` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'FEDAPAY';

-- AlterTable
ALTER TABLE "public"."Course" DROP COLUMN "currentParticipants",
DROP COLUMN "maxParticipants";

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "paymentMethod",
ADD COLUMN     "method" "public"."PaymentMethod" NOT NULL DEFAULT 'OTHER',
ALTER COLUMN "paymentDate" SET DEFAULT CURRENT_TIMESTAMP;
