/*
  Warnings:

  - You are about to drop the `AgencyConnection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GhlLocationToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GhlLocationToken" DROP CONSTRAINT "GhlLocationToken_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "GhlLocationToken" DROP CONSTRAINT "GhlLocationToken_organizationId_ghlLocationId_fkey";

-- AlterTable
ALTER TABLE "OrgLocation" ADD COLUMN     "apiToken" TEXT;

-- DropTable
DROP TABLE "AgencyConnection";

-- DropTable
DROP TABLE "GhlLocationToken";
