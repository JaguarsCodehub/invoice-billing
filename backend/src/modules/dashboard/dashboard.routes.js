"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const db_1 = __importDefault(require("../../config/db"));
const dayjs_1 = __importDefault(require("dayjs"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/", async (req, res) => {
    try {
        const user = req.user;
        const businessId = user.businessId;
        const startOfMonth = (0, dayjs_1.default)().startOf('month').toDate();
        // 1 & 2. Total Revenue & Outstanding Receivables
        const allInvoices = await db_1.default.invoice.findMany({
            where: { businessId, status: { notIn: ['DRAFT', 'CANCELLED'] } }
        });
        const totalRevenue = allInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
        const unpaidInvoiceCount = allInvoices.filter(i => ['SENT', 'PARTIAL', 'OVERDUE'].includes(i.status)).length;
        const customerPayments = await db_1.default.payment.findMany({
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
        const invoicesThisMonth = await db_1.default.invoice.count({
            where: {
                businessId,
                status: { notIn: ['DRAFT', 'CANCELLED'] },
                date: { gte: startOfMonth }
            }
        });
        // 4. Active Parties
        const activeParties = await db_1.default.party.count({
            where: { businessId }
        });
        // 5. Chart Data (Last 6 Months Revenue & Expenses)
        const sixMonthsAgo = (0, dayjs_1.default)().subtract(5, 'month').startOf('month').toDate();
        const recentInvoices = await db_1.default.invoice.findMany({
            where: {
                businessId,
                status: { notIn: ['DRAFT', 'CANCELLED'] },
                date: { gte: sixMonthsAgo }
            },
            include: { items: true }
        });
        const recentPurchases = await db_1.default.purchaseInvoice.findMany({
            where: {
                businessId,
                status: { notIn: ['DRAFT'] },
                date: { gte: sixMonthsAgo }
            }
        });
        const chartDataMap = {};
        for (let i = 5; i >= 0; i--) {
            const monthStr = (0, dayjs_1.default)().subtract(i, 'month').format('MMM YYYY');
            chartDataMap[monthStr] = { month: monthStr, revenue: 0, expenses: 0 };
        }
        recentInvoices.forEach(inv => {
            const monthStr = (0, dayjs_1.default)(inv.date).format('MMM YYYY');
            if (chartDataMap[monthStr]) {
                chartDataMap[monthStr].revenue += Number(inv.total);
            }
        });
        recentPurchases.forEach(pur => {
            const monthStr = (0, dayjs_1.default)(pur.date).format('MMM YYYY');
            if (chartDataMap[monthStr]) {
                chartDataMap[monthStr].expenses += Number(pur.total);
            }
        });
        const chartData = Object.values(chartDataMap);
        // 6. Weekly Revenue (Last 7 Days)
        const sevenDaysAgo = (0, dayjs_1.default)().subtract(6, 'day').startOf('day').toDate();
        const weeklyDataMap = {};
        for (let i = 6; i >= 0; i--) {
            const dateStr = (0, dayjs_1.default)().subtract(i, 'day').format('DD MMM');
            weeklyDataMap[dateStr] = { date: dateStr, revenue: 0 };
        }
        recentInvoices.filter(i => (0, dayjs_1.default)(i.date).isAfter(sevenDaysAgo)).forEach(inv => {
            const dateStr = (0, dayjs_1.default)(inv.date).format('DD MMM');
            if (weeklyDataMap[dateStr]) {
                weeklyDataMap[dateStr].revenue += Number(inv.total);
            }
        });
        const weeklyRevenue = Object.values(weeklyDataMap);
        // 7. Top Selling Products
        const productSales = {};
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
        const latestInvoices = await db_1.default.invoice.findMany({
            where: { businessId },
            include: { party: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        const latestPayments = await db_1.default.payment.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map