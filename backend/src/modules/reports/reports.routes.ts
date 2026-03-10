import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";
import dayjs from "dayjs";

const router = Router();
router.use(authenticate);

// 1. Sales Report
router.get("/sales", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { startDate, endDate } = req.query;
    
    const start = dayjs(startDate as string).startOf('day').toDate();
    const end = dayjs(endDate as string).endOf('day').toDate();

    const invoices = await prisma.invoice.findMany({
      where: {
        businessId: user.businessId,
        date: { gte: start, lte: end },
        status: { notIn: ['DRAFT', 'CANCELLED'] }
      },
      include: { party: { select: { name: true } } },
      orderBy: { date: 'asc' }
    });

    const totalSales = invoices.reduce((acc, inv) => acc + Number(inv.total), 0);
    const totalTax = invoices.reduce((acc, inv) => acc + Number(inv.taxAmount), 0);
    const invoiceCount = invoices.length;

    res.json({
      totalSales,
      totalTax,
      invoiceCount,
      data: invoices
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Purchase Report
router.get("/purchases", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { startDate, endDate } = req.query;
    
    const start = dayjs(startDate as string).startOf('day').toDate();
    const end = dayjs(endDate as string).endOf('day').toDate();

    const purchases = await prisma.purchaseInvoice.findMany({
      where: {
        businessId: user.businessId,
        date: { gte: start, lte: end },
        status: { notIn: ['DRAFT'] }
      },
      include: { party: { select: { name: true } } },
      orderBy: { date: 'asc' }
    });

    const totalPurchases = purchases.reduce((acc, pur) => acc + Number(pur.total), 0);
    const totalTax = purchases.reduce((acc, pur) => acc + Number(pur.taxAmount), 0);

    res.json({
      totalPurchases,
      totalTax,
      data: purchases
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GST Report (Summary of Tax Out vs Tax In)
router.get("/gst", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { startDate, endDate } = req.query;
    
    const start = dayjs(startDate as string).startOf('day').toDate();
    const end = dayjs(endDate as string).endOf('day').toDate();

    // Tax Out (Sales)
    const sales = await prisma.invoice.findMany({
      where: {
        businessId: user.businessId,
        date: { gte: start, lte: end },
        status: { notIn: ['DRAFT', 'CANCELLED'] }
      }
    });

    // Tax In (Purchases)
    const purchases = await prisma.purchaseInvoice.findMany({
      where: {
        businessId: user.businessId,
        date: { gte: start, lte: end },
        status: { notIn: ['DRAFT'] }
      }
    });

    const taxOut = sales.reduce((acc, inv) => acc + Number(inv.taxAmount), 0);
    const taxIn = purchases.reduce((acc, pur) => acc + Number(pur.taxAmount), 0);

    res.json({
      taxOut,
      taxIn,
      netPayable: Math.max(0, taxOut - taxIn),
      startDate,
      endDate
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
