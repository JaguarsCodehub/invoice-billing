import prisma from "../config/db";

/**
 * Recalculates and updates the outstanding balance for a party.
 * Outstanding = (Opening Balance) + (Total Invoiced/Billed Amount) - (Total Payments Amount)
 */
export async function updatePartyOutstanding(partyId: string, tx?: any) {
  const db = tx || prisma;

  // Find the party
  const party = await db.party.findUnique({
    where: { id: partyId },
    select: { type: true, openingBalance: true }
  });

  if (!party) return;

  let totalBilled = 0;
  let totalPaid = 0;

  // 1. Sum up Invoices (for Customers and BOTH)
  // Only include official TAX_INVOICE that are beyond DRAFT
  const invoices = await db.invoice.aggregate({
    where: {
      partyId,
      status: { in: ["SENT", "PARTIAL", "PAID", "OVERDUE"] },
      type: "TAX_INVOICE"
    },
    _sum: { total: true }
  });
  totalBilled += Number(invoices._sum.total || 0);

  // 2. Sum up Purchase Invoices (for Suppliers and BOTH)
  const purchaseInvoices = await db.purchaseInvoice.aggregate({
    where: {
      partyId,
      status: { in: ["RECEIVED", "PARTIAL", "PAID", "OVERDUE"] }
    },
    _sum: { total: true }
  });
  totalBilled += Number(purchaseInvoices._sum.total || 0);

  // 3. Sum up Payments
  const payments = await db.payment.aggregate({
    where: {
      partyId,
      status: "SUCCESS"
    },
    _sum: { amount: true }
  });
  totalPaid = Number(payments._sum.amount || 0);

  // Net Balance = Opening Balance + Invoiced - Paid
  const outstanding = Number(party.openingBalance) + totalBilled - totalPaid;

  // 4. Update the party
  await db.party.update({
    where: { id: partyId },
    data: { outstanding }
  });

  return outstanding;
}

/**
 * Records an entry in the party ledger and updates the party's outstanding balance.
 */
export async function recordLedgerEntry(params: {
  businessId: string;
  partyId: string;
  type: "INVOICE" | "PAYMENT" | "REFUND" | "ADJUSTMENT" | "OPENING_BALANCE";
  amount: number;
  reference?: string;
  notes?: string;
  date?: Date;
  tx?: any;
}) {
  const { businessId, partyId, type, amount, reference, notes, date, tx } = params;
  const db = tx || prisma;

  // 1. Update the outstanding balance first
  const newBalance = await updatePartyOutstanding(partyId, db);

  // 2. Create the ledger entry
  return await db.partyLedger.create({
    data: {
      businessId,
      partyId,
      type,
      amount,
      balance: newBalance || 0,
      reference,
      notes,
      date: date || new Date(),
    }
  });
}
