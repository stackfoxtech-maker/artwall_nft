-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "artwall";

-- CreateEnum
CREATE TYPE "artwall"."Privacy" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "artwall"."ObjectType" AS ENUM ('PHYSICAL_ARTWORK', 'DIGITAL_ARTWORK', 'EDITION', 'PHOTOGRAPH', 'SCULPTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "artwall"."CertificateStatus" AS ENUM ('DRAFT', 'METADATA_PINNED', 'MINTING', 'MINTED', 'FAILED');

-- CreateTable
CREATE TABLE "artwall"."User" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwall"."Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwall"."Certificate" (
    "id" TEXT NOT NULL,
    "status" "artwall"."CertificateStatus" NOT NULL DEFAULT 'DRAFT',
    "creatorName" TEXT NOT NULL,
    "privacy" "artwall"."Privacy" NOT NULL DEFAULT 'PUBLIC',
    "objectType" "artwall"."ObjectType" NOT NULL DEFAULT 'PHYSICAL_ARTWORK',
    "title" TEXT NOT NULL,
    "medium" TEXT,
    "dimensions" TEXT,
    "year" INTEGER,
    "editionInfo" TEXT,
    "imageCid" TEXT,
    "metadataCid" TEXT,
    "metadataUri" TEXT,
    "privateNote" TEXT,
    "unlockableReward" TEXT,
    "physicalLinkId" TEXT,
    "chainId" INTEGER,
    "contractAddr" TEXT,
    "tokenId" TEXT,
    "txHash" TEXT,
    "mintedAt" TIMESTAMP(3),
    "ownerId" UUID NOT NULL,
    "collectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwall"."RoyaltySplit" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "payeeAddress" TEXT NOT NULL,
    "basisPoints" INTEGER NOT NULL,
    "label" TEXT,

    CONSTRAINT "RoyaltySplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "artwall"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "artwall"."User"("walletAddress");

-- CreateIndex
CREATE INDEX "Collection_ownerId_idx" ON "artwall"."Collection"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_physicalLinkId_key" ON "artwall"."Certificate"("physicalLinkId");

-- CreateIndex
CREATE INDEX "Certificate_ownerId_idx" ON "artwall"."Certificate"("ownerId");

-- CreateIndex
CREATE INDEX "Certificate_collectionId_idx" ON "artwall"."Certificate"("collectionId");

-- CreateIndex
CREATE INDEX "Certificate_status_idx" ON "artwall"."Certificate"("status");

-- CreateIndex
CREATE INDEX "RoyaltySplit_certificateId_idx" ON "artwall"."RoyaltySplit"("certificateId");

-- AddForeignKey
ALTER TABLE "artwall"."Collection" ADD CONSTRAINT "Collection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "artwall"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwall"."Certificate" ADD CONSTRAINT "Certificate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "artwall"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwall"."Certificate" ADD CONSTRAINT "Certificate_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "artwall"."Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwall"."RoyaltySplit" ADD CONSTRAINT "RoyaltySplit_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "artwall"."Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

