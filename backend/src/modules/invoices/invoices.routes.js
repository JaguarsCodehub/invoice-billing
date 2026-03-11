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
const invoiceItemSchema = zod_1.z.object({
    productId: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string(),
    qty: zod_1.z.number().positive(),
    unit: zod_1.z.string().default("PCS"),
    unitPrice: zod_1.z.number().nonnegative(),
    discount: zod_1.z.number().nonnegative().default(0),
    taxAmount: zod_1.z.number().nonnegative().default(0),
});
const invoiceSchema = zod_1.z.object({
    partyId: zod_1.z.string(),
    type: zod_1.z.enum(["TAX_INVOICE", "PROFORMA", "CREDIT_NOTE", "DEBIT_NOTE", "DELIVERY_CHALLAN"]),
    number: zod_1.z.string(),
    date: zod_1.z.string(),
    dueDate: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
    discount: zod_1.z.number().default(0),
    notes: zod_1.z.string().optional().nullable(),
    items: zod_1.z.array(invoiceItemSchema).min(1),
});
// Create Invoice
router.post("/", async (req, res) => {
    try {
        const user = req.user;
        const data = invoiceSchema.parse(req.body);
        // Calculate subtotal, tax and total
        let subtotal = 0;
        let taxAmount = 0;
        const computedItems = data.items.map(item => {
            const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
            subtotal += (item.qty * item.unitPrice) - item.discount;
            taxAmount += item.taxAmount;
            return {
                ...item,
                total: itemTotal
            };
        });
        const total = subtotal + taxAmount - data.discount;
        // Transaction to create invoice and deduct stock if needed
        const result = await db_1.default.$transaction(async (tx) => {
            const invoice = await tx.invoice.create({
                data: {
                    businessId: user.businessId,
                    partyId: data.partyId,
                    type: data.type,
                    number: data.number,
                    date: new Date(data.date),
                    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                    status: data.status,
                    subtotal,
                    taxAmount,
                    discount: data.discount,
                    total,
                    notes: data.notes,
                    items: {
                        create: computedItems
                    }
                },
                include: { items: true, party: true }
            });
            // If TAX_INVOICE and status changes to Accepted, deduct stock
            if (data.type === 'TAX_INVOICE' && isInvoiceAccepted(data.status)) {
                const warehouse = await tx.warehouse.findFirst({
                    where: { businessId: user.businessId, isDefault: true }
                }) || await tx.warehouse.create({
                    data: { name: "Main", isDefault: true, businessId: user.businessId }
                });
                for (const item of computedItems) {
                    if (item.productId) {
                        await tx.stockEntry.create({
                            data: {
                                businessId: user.businessId,
                                productId: item.productId,
                                warehouseId: warehouse.id,
                                type: "OUT",
                                qty: item.qty,
                                reference: invoice.number,
                                notes: `Sold via Invoice ${invoice.number}`
                            }
                        });
                    }
                }
            }
            return invoice;
        });
        res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});
// Get all invoices
router.get("/", async (req, res) => {
    try {
        const user = req.user;
        const { status, partyId } = req.query;
        const invoices = await db_1.default.invoice.findMany({
            where: {
                businessId: user.businessId,
                ...(status ? { status: status } : {}),
                ...(partyId ? { partyId: typeof partyId === 'string' ? partyId : partyId[0] } : {})
            },
            include: {
                party: { select: { name: true, type: true } }
            },
            orderBy: { date: "desc" }
        });
        res.json(invoices);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get invoice by ID
router.get("/:id", async (req, res) => {
    try {
        const user = req.user;
        const invoice = await db_1.default.invoice.findFirst({
            where: { id: req.params.id, businessId: user.businessId },
            include: {
                items: true,
                party: true,
                payments: true
            }
        });
        if (!invoice)
            return res.status(404).json({ error: "Invoice not found" });
        res.json(invoice);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Helper to check if invoice status impacts stock
const isInvoiceAccepted = (status) => ['SENT', 'PARTIAL', 'PAID'].includes(status);
// Update invoice
router.put("/:id", async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const data = invoiceSchema.parse(req.body);
        const existing = await db_1.default.invoice.findFirst({
            where: { id: id, businessId: user.businessId },
            include: { items: true }
        });
        if (!existing)
            return res.status(404).json({ error: "Invoice not found" });
        let subtotal = 0;
        let taxAmount = 0;
        const computedItems = data.items.map((item) => {
            const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
            subtotal += (item.qty * item.unitPrice) - item.discount;
            taxAmount += item.taxAmount;
            return {
                ...item,
                total: itemTotal
            };
        });
        const total = subtotal + taxAmount - data.discount;
        const result = await db_1.default.$transaction(async (tx) => {
            // 1. Delete old items
            await tx.invoiceItem.deleteMany({
                where: { invoiceId: id }
            });
            // 2. Update invoice and create new items
            const updated = await tx.invoice.update({
                where: { id: id },
                data: {
                    partyId: data.partyId,
                    type: data.type,
                    number: data.number,
                    date: new Date(data.date),
                    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                    status: data.status,
                    subtotal,
                    taxAmount,
                    discount: data.discount,
                    total,
                    notes: data.notes,
                    items: {
                        create: computedItems
                    }
                },
                include: { items: true, party: true }
            });
            // 3. Reconcile Stock Entries
            // Delete old stock entries for this invoice
            await tx.stockEntry.deleteMany({
                where: { businessId: user.businessId, reference: existing.number }
            });
            // If new status is Accepted and type is TAX_INVOICE, create new entries
            if (data.type === 'TAX_INVOICE' && isInvoiceAccepted(data.status)) {
                const warehouse = await tx.warehouse.findFirst({
                    where: { businessId: user.businessId, isDefault: true }
                }) || await tx.warehouse.create({
                    data: { name: "Main", isDefault: true, businessId: user.businessId }
                });
                for (const item of computedItems) {
                    if (item.productId) {
                        await tx.stockEntry.create({
                            data: {
                                businessId: user.businessId,
                                productId: item.productId,
                                warehouseId: warehouse.id,
                                type: "OUT",
                                qty: item.qty,
                                reference: updated.number,
                                notes: `Sold via Invoice ${updated.number} (Updated)`
                            }
                        });
                    }
                }
            }
            return updated;
        });
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});
// Update Invoice Status
router.patch("/:id/status", async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { status } = zod_1.z.object({
            status: zod_1.z.enum(["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"])
        }).parse(req.body);
        const existing = await db_1.default.invoice.findFirst({
            where: { id: id, businessId: user.businessId },
            include: { items: true }
        });
        if (!existing)
            return res.status(404).json({ error: "Invoice not found" });
        const result = await db_1.default.$transaction(async (tx) => {
            const updated = await tx.invoice.update({
                where: { id: id },
                data: { status },
                include: { items: true, party: true }
            });
            // Stock Reconciliation
            const wasAccepted = isInvoiceAccepted(existing.status);
            const isAccepted = isInvoiceAccepted(status);
            if (existing.type === 'TAX_INVOICE') {
                if (!wasAccepted && isAccepted) {
                    // Add stock entries
                    const warehouse = await tx.warehouse.findFirst({
                        where: { businessId: user.businessId, isDefault: true }
                    }) || await tx.warehouse.create({
                        data: { name: "Main", isDefault: true, businessId: user.businessId }
                    });
                    for (const item of updated.items) {
                        if (item.productId) {
                            await tx.stockEntry.create({
                                data: {
                                    businessId: user.businessId,
                                    productId: item.productId,
                                    warehouseId: warehouse.id,
                                    type: "OUT",
                                    qty: item.qty,
                                    reference: updated.number,
                                    notes: `Sold via Invoice ${updated.number} (Status Change)`
                                }
                            });
                        }
                    }
                }
                else if (wasAccepted && !isAccepted) {
                    // Remove stock entries
                    await tx.stockEntry.deleteMany({
                        where: { businessId: user.businessId, reference: updated.number }
                    });
                }
            }
            return updated;
        });
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=invoices.routes.js.map