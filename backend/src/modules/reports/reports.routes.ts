import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";

const router = Router();
router.use(authenticate);

router.get("/dashboard-stats", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const businessId = user.businessId;

    // 1. Total Revenue (sum of all PAID and PARTIAL invoices)
    const invoices = await prisma.invoice.findMany({
      where: { businessId, status: { in: ['PAID', 'PARTIAL', 'SENT'] } }
    });

    const totalRevenue = invoices.reduce((acc, inv) => acc + Number(inv.total), 0);
    
    // 2. Receivables
    const payments = await prisma.payment.findMany({
      where: { businessId, status: 'SUCCESS' }
    });
    const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const receivables = totalRevenue - totalPaid;

    // 3. Total Expenses/Purchases
    const purchases = await prisma.purchaseInvoice.findMany({
      where: { businessId }
    });
    const totalPurchases = purchases.reduce((acc, p) => acc + Number(p.total), 0);

    // 4. Counts
    const invoiceCount = await prisma.invoice.count({ where: { businessId } });
    const customerCount = await prisma.party.count({ where: { businessId, type: { in: ['CUSTOMER', 'BOTH'] } } });

    res.json({
      totalRevenue,
      receivables,
      totalPurchases,
      invoiceCount,
      customerCount
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
