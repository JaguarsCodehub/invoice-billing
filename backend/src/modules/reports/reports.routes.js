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
// 1. Sales Report
router.get("/sales", async (req, res) => {
    try {
        const user = req.user;
        const { startDate, endDate } = req.query;
        const start = (0, dayjs_1.default)(startDate).startOf('day').toDate();
        const end = (0, dayjs_1.default)(endDate).endOf('day').toDate();
        const invoices = await db_1.default.invoice.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 2. Purchase Report
router.get("/purchases", async (req, res) => {
    try {
        const user = req.user;
        const { startDate, endDate } = req.query;
        const start = (0, dayjs_1.default)(startDate).startOf('day').toDate();
        const end = (0, dayjs_1.default)(endDate).endOf('day').toDate();
        const purchases = await db_1.default.purchaseInvoice.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 3. GST Report (Summary of Tax Out vs Tax In)
router.get("/gst", async (req, res) => {
    try {
        const user = req.user;
        const { startDate, endDate } = req.query;
        const start = (0, dayjs_1.default)(startDate).startOf('day').toDate();
        const end = (0, dayjs_1.default)(endDate).endOf('day').toDate();
        // Tax Out (Sales)
        const sales = await db_1.default.invoice.findMany({
            where: {
                businessId: user.businessId,
                date: { gte: start, lte: end },
                status: { notIn: ['DRAFT', 'CANCELLED'] }
            }
        });
        // Tax In (Purchases)
        const purchases = await db_1.default.purchaseInvoice.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=reports.routes.js.map