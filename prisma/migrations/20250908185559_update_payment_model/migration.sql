/*
  Warnings:

  - The `method` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "method",
ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'unknown';

-- DropEnum
DROP TYPE "public"."PaymentMethod";
