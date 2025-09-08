/*
  Warnings:

  - The values [CARD,BANK_TRANSFER,MOBILE_MONEY,FEDAPAY] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('USD', 'EUR', 'XOF');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentMethod_new" AS ENUM ('MOOV', 'MTN', 'CASH', 'OTHER', 'UNKNOWN');
ALTER TABLE "public"."Payment" ALTER COLUMN "method" DROP DEFAULT;
ALTER TABLE "public"."Payment" ALTER COLUMN "method" TYPE "public"."PaymentMethod_new" USING ("method"::text::"public"."PaymentMethod_new");
ALTER TYPE "public"."PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "public"."PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
ALTER TABLE "public"."Payment" ALTER COLUMN "method" SET DEFAULT 'OTHER';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "currency" "public"."Currency" NOT NULL DEFAULT 'XOF',
ADD COLUMN     "phoneNumber" TEXT;
