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
CREATE INDEX "GhlLocationToken_organizationId_idx" ON "GhlLocationToken"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "GhlLocationToken_organizationId_ghlLocationId_key" ON "GhlLocationToken"("organizationId", "ghlLocationId");

-- AddForeignKey
ALTER TABLE "GhlLocationToken" ADD CONSTRAINT "GhlLocationToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhlLocationToken" ADD CONSTRAINT "GhlLocationToken_organizationId_ghlLocationId_fkey" FOREIGN KEY ("organizationId", "ghlLocationId") REFERENCES "OrgLocation"("organizationId", "ghlLocationId") ON DELETE RESTRICT ON UPDATE CASCADE;
