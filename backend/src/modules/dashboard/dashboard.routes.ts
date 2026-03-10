import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";
import dayjs from "dayjs";

const router = Router();
router.use(authenticate);

router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const businessId = user.businessId;

    const startOfMonth = dayjs().startOf('month').toDate();

    // 1 & 2. Total Revenue & Outstanding Receivables
    const allInvoices = await prisma.invoice.findMany({
      where: { businessId, status: { notIn: ['DRAFT', 'CANCELLED'] } }
    });
    
    const totalRevenue = allInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
    const unpaidInvoiceCount = allInvoices.filter(i => ['SENT', 'PARTIAL', 'OVERDUE'].includes(i.status)).length;
    
    const customerPayments = await prisma.payment.findMany({
      where: { 
        businessId, 
        status: 'SUCCESS',
        party: { type: { notIn: ['SUPPLIER'] } } // Customers and BOTH
      }
    });

    const totalReceived = customerPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    
    // Total owed minus total paid. Floor at 0 in case of advances.
    const outstandingReceivables = Math.max(0, totalRevenue - totalReceived);

    // 3. Invoices Issued This Month
    const invoicesThisMonth = await prisma.invoice.count({
      where: {
        businessId,
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        date: { gte: startOfMonth }
      }
    });

    // 4. Active Parties
    const activeParties = await prisma.party.count({
      where: { businessId }
    });

    // 5. Chart Data (Last 6 Months Revenue & Expenses)
    const sixMonthsAgo = dayjs().subtract(5, 'month').startOf('month').toDate();

    const recentInvoices = await prisma.invoice.findMany({
      where: { 
        businessId, 
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        date: { gte: sixMonthsAgo }
      },
      include: { items: true }
    });

    const recentPurchases = await prisma.purchaseInvoice.findMany({
      where: {
        businessId,
        status: { notIn: ['DRAFT'] },
        date: { gte: sixMonthsAgo }
      }
    });

    const chartDataMap: Record<string, { month: string; revenue: number; expenses: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const monthStr = dayjs().subtract(i, 'month').format('MMM YYYY');
      chartDataMap[monthStr] = { month: monthStr, revenue: 0, expenses: 0 };
    }

    recentInvoices.forEach(inv => {
      const monthStr = dayjs(inv.date).format('MMM YYYY');
      if (chartDataMap[monthStr]) {
        chartDataMap[monthStr].revenue += Number(inv.total);
      }
    });

    recentPurchases.forEach(pur => {
      const monthStr = dayjs(pur.date).format('MMM YYYY');
      if (chartDataMap[monthStr]) {
        chartDataMap[monthStr].expenses += Number(pur.total);
      }
    });

    const chartData = Object.values(chartDataMap);

    // 6. Weekly Revenue (Last 7 Days)
    const sevenDaysAgo = dayjs().subtract(6, 'day').startOf('day').toDate();
    const weeklyDataMap: Record<string, { date: string; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const dateStr = dayjs().subtract(i, 'day').format('DD MMM');
      weeklyDataMap[dateStr] = { date: dateStr, revenue: 0 };
    }

    recentInvoices.filter(i => dayjs(i.date).isAfter(sevenDaysAgo)).forEach(inv => {
      const dateStr = dayjs(inv.date).format('DD MMM');
      if (weeklyDataMap[dateStr]) {
        weeklyDataMap[dateStr].revenue += Number(inv.total);
      }
    });

    const weeklyRevenue = Object.values(weeklyDataMap);

    // 7. Top Selling Products
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    recentInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (item.productId) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.description, qty: 0, revenue: 0 };
          }
          productSales[item.productId].qty += Number(item.qty);
          productSales[item.productId].revenue += Number(item.total);
        }
      });
    });

    const topSellingItems = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 8. Profit Metrics
    const totalExpenses = recentPurchases.reduce((acc, p) => acc + Number(p.total), 0);
    const grossProfit = totalRevenue - totalExpenses;
    const netProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // 9. Recent Activity
    const latestInvoices = await prisma.invoice.findMany({
      where: { businessId },
      include: { party: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const latestPayments = await prisma.payment.findMany({
      where: { businessId },
      include: { party: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const combinedActivity = [
      ...latestInvoices.map(i => ({
        id: i.id,
        type: 'INVOICE',
        title: `Invoice ${i.number} created`,
        description: `Billed ${i.party.name} for ₹${Number(i.total).toFixed(2)}`,
        date: i.createdAt
      })),
      ...latestPayments.map(p => ({
        id: p.id,
        type: p.party?.type === 'SUPPLIER' ? 'PAYMENT_OUT' : 'RECEIPT_IN',
        title: p.party?.type === 'SUPPLIER' ? 'Payment Sent' : 'Payment Received',
        description: `${p.party?.type === 'SUPPLIER' ? 'Paid' : 'Received from'} ${p.party?.name} for ₹${Number(p.amount).toFixed(2)}`,
        date: p.createdAt
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    res.json({
      totalRevenue,
      outstandingReceivables,
      unpaidInvoiceCount,
      invoicesThisMonth,
      activeParties,
      chartData,
      weeklyRevenue,
      topSellingItems,
      grossProfit,
      netProfitMargin,
      recentActivity: combinedActivity
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
