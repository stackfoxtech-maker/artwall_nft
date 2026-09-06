-- AlterTable
ALTER TABLE "artwall"."Certificate" ADD COLUMN     "metadataSha256" TEXT,
ADD COLUMN     "mintError" TEXT,
ADD COLUMN     "mintNonce" TEXT,
ADD COLUMN     "mintRequestedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_mintNonce_key" ON "artwall"."Certificate"("mintNonce");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_txHash_key" ON "artwall"."Certificate"("txHash");

