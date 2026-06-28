-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('user', 'superadmin');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'starter', 'pro');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL DEFAULT 'free',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "brandName" TEXT,
    "brandColor" TEXT,
    "brandLogoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'member',
    "ghlLocationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhlConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "agencyName" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GhlConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgLocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ghlLocationId" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhlLocationToken" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ghlLocationId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "companyId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GhlLocationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_profileId_organizationId_key" ON "Membership"("profileId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "GhlConnection_organizationId_key" ON "GhlConnection"("organizationId");

-- CreateIndex
CREATE INDEX "OrgLocation_organizationId_idx" ON "OrgLocation"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgLocation_organizationId_ghlLocationId_key" ON "OrgLocation"("organizationId", "ghlLocationId");

-- CreateIndex
CREATE INDEX "GhlLocationToken_organizationId_idx" ON "GhlLocationToken"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "GhlLocationToken_organizationId_ghlLocationId_key" ON "GhlLocationToken"("organizationId", "ghlLocationId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhlConnection" ADD CONSTRAINT "GhlConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgLocation" ADD CONSTRAINT "OrgLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhlLocationToken" ADD CONSTRAINT "GhlLocationToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhlLocationToken" ADD CONSTRAINT "GhlLocationToken_organizationId_ghlLocationId_fkey" FOREIGN KEY ("organizationId", "ghlLocationId") REFERENCES "OrgLocation"("organizationId", "ghlLocationId") ON DELETE RESTRICT ON UPDATE CASCADE;
