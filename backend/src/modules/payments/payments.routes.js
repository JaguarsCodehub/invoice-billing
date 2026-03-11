"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const paymentSchema = zod_1.z.object({
    invoiceId: zod_1.z.string().optional().nullable(),
    partyId: zod_1.z.string(),
    amount: zod_1.z.number().positive(),
    date: zod_1.z.string(),
    mode: zod_1.z.enum(["CASH", "CHEQUE", "UPI", "NEFT_RTGS", "CARD", "CREDIT", "ADVANCE"]),
    reference: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
// Record a Payment
router.post("/", async (req, res) => {
    try {
        const user = req.user;
        const data = paymentSchema.parse(req.body);
        const result = await db_1.default.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    businessId: user.businessId,
                    invoiceId: data.invoiceId,
                    partyId: data.partyId,
                    amount: data.amount,
                    date: new Date(data.date),
                    mode: data.mode,
                    reference: data.reference,
                    notes: data.notes,
                }
            });
            // Update invoice status if applicable
            if (data.invoiceId) {
                const invoice = await tx.invoice.findUnique({
                    where: { id: data.invoiceId },
                    include: { payments: true }
                });
                if (invoice) {
                    // Calculate total paid so far including this payment because include.payments might not have picked up the un-committed one depending on prisma transaction isolation, but wait, the payment is created in the same tx, so findUnique might return it or not depending on context. Best to just sum from DB explicitly.
                    const allPayments = await tx.payment.findMany({
                        where: { invoiceId: invoice.id, status: "SUCCESS" }
                    });
                    const totalPaid = allPayments.reduce((acc, p) => acc + Number(p.amount), 0);
                    let newStatus = invoice.status;
                    if (totalPaid >= Number(invoice.total)) {
                        newStatus = "PAID";
                    }
                    else if (totalPaid > 0) {
                        newStatus = "PARTIAL";
                    }
                    if (newStatus !== invoice.status) {
                        await tx.invoice.update({
                            where: { id: invoice.id },
                            data: { status: newStatus }
                        });
                    }
                }
            }
            return payment;
        });
        res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.errors });
        res.status(500).json({ error: error.message });
    }
});
// Get payments
router.get("/", async (req, res) => {
    try {
        const user = req.user;
        const { partyId, invoiceId } = req.query;
        const payments = await db_1.default.payment.findMany({
            where: {
                businessId: user.businessId,
                ...(partyId ? { partyId: partyId } : {}),
                ...(invoiceId ? { invoiceId: invoiceId } : {})
            },
            include: {
                party: { select: { name: true, type: true } },
                invoice: { select: { number: true } }
            },
            orderBy: { date: "desc" }
        });
        const formattedPayments = payments.map(p => ({
            ...p,
            number: `PAY-${p.id.substring(0, 6).toUpperCase()}`,
            type: p.party?.type === 'SUPPLIER' ? 'OUT' : 'IN'
        }));
        res.json(formattedPayments);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=payments.routes.js.map