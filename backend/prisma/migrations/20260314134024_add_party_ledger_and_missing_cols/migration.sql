-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('INVOICE', 'PAYMENT', 'REFUND', 'ADJUSTMENT', 'OPENING_BALANCE');

-- CreateTable
CREATE TABLE "PartyLedger" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartyLedger_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PartyLedger" ADD CONSTRAINT "PartyLedger_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyLedger" ADD CONSTRAINT "PartyLedger_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;
