/*
  Warnings:

  - You are about to drop the `GhlConnection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GhlConnection" DROP CONSTRAINT "GhlConnection_organizationId_fkey";

-- DropTable
DROP TABLE "GhlConnection";

-- CreateTable
CREATE TABLE "AgencyConnection" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyId" TEXT NOT NULL,
    "agencyName" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyConnection_pkey" PRIMARY KEY ("id")
);
