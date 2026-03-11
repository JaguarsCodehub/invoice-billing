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
const purchaseItemSchema = zod_1.z.object({
    productId: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string(),
    qty: zod_1.z.number().positive(),
    unit: zod_1.z.string().default("PCS"),
    unitPrice: zod_1.z.number().nonnegative(),
    discount: zod_1.z.number().nonnegative().default(0),
    taxAmount: zod_1.z.number().nonnegative().default(0),
});
const purchaseOrderSchema = zod_1.z.object({
    partyId: zod_1.z.string(),
    number: zod_1.z.string(),
    date: zod_1.z.string(),
    status: zod_1.z.enum(["DRAFT", "SENT", "CONFIRMED", "RECEIVED", "CANCELLED"]).default("DRAFT"),
    notes: zod_1.z.string().optional().nullable(),
    items: zod_1.z.array(purchaseItemSchema).min(1),
});
const purchaseInvoiceSchema = zod_1.z.object({
    partyId: zod_1.z.string(),
    poId: zod_1.z.string().optional().nullable(),
    number: zod_1.z.string(),
    date: zod_1.z.string(),
    dueDate: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(["DRAFT", "PENDING", "RECEIVED", "PARTIAL", "PAID", "OVERDUE"]).default("DRAFT"),
    discount: zod_1.z.number().default(0),
    notes: zod_1.z.string().optional().nullable(),
    items: zod_1.z.array(purchaseItemSchema).min(1),
});
// Create Purchase Order
router.post("/orders", async (req, res) => {
    try {
        const user = req.user;
        const data = purchaseOrderSchema.parse(req.body);
        let subtotal = 0;
        let taxAmount = 0;
        const computedItems = data.items.map(item => {
            const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
            subtotal += (item.qty * item.unitPrice) - item.discount;
            taxAmount += item.taxAmount;
            return { ...item, total: itemTotal };
        });
        const total = subtotal + taxAmount;
        const po = await db_1.default.purchaseOrder.create({
            data: {
                businessId: user.businessId,
                partyId: data.partyId,
                number: data.number,
                date: new Date(data.date),
                status: data.status,
                subtotal,
                taxAmount,
                total,
                notes: data.notes,
                items: {
                    create: computedItems
                }
            },
            include: { items: true, party: true }
        });
        res.status(201).json(po);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.errors });
        res.status(500).json({ error: error.message });
    }
});
// Create Purchase Invoice (Bill)
router.post("/invoices", async (req, res) => {
    try {
        const user = req.user;
        const data = purchaseInvoiceSchema.parse(req.body);
        let subtotal = 0;
        let taxAmount = 0;
        const computedItems = data.items.map(item => {
            const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
            subtotal += (item.qty * item.unitPrice) - item.discount;
            taxAmount += item.taxAmount;
            return { ...item, total: itemTotal };
        });
        const total = subtotal + taxAmount - data.discount;
        // Transaction to create bill and add stock
        const result = await db_1.default.$transaction(async (tx) => {
            const bill = await tx.purchaseInvoice.create({
                data: {
                    businessId: user.businessId,
                    partyId: data.partyId,
                    poId: data.poId,
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
            // If status is RECEIVED, add stock (User requested: "stock only change... when a Purchase is Received")
            if (data.status === 'RECEIVED') {
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
                                type: "IN",
                                qty: item.qty,
                                cost: item.unitPrice,
                                reference: bill.number,
                                notes: `Purchased via Bill ${bill.number}`
                            }
                        });
                        // Update purchase price in product master
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { purchasePrice: item.unitPrice }
                        });
                    }
                }
            }
            return bill;
        });
        res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.errors });
        res.status(500).json({ error: error.message });
    }
});
// Get all Purchase Invoices
router.get("/invoices", async (req, res) => {
    try {
        const user = req.user;
        const { status, partyId } = req.query;
        const bills = await db_1.default.purchaseInvoice.findMany({
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
        res.json(bills);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get Purchase Invoice by ID
router.get("/invoices/:id", async (req, res) => {
    try {
        const user = req.user;
        const bill = await db_1.default.purchaseInvoice.findFirst({
            where: { id: req.params.id, businessId: user.businessId },
            include: {
                items: true,
                party: true
            }
        });
        if (!bill)
            return res.status(404).json({ error: "Purchase Bill not found" });
        res.json(bill);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Helper to check if purchase status impacts stock
const isPurchaseReceived = (status) => status === 'RECEIVED';
// Update Purchase Invoice
router.put("/invoices/:id", async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const data = purchaseInvoiceSchema.parse(req.body);
        const existing = await db_1.default.purchaseInvoice.findFirst({
            where: { id: id, businessId: user.businessId },
            include: { items: true }
        });
        if (!existing)
            return res.status(404).json({ error: "Purchase Bill not found" });
        let subtotal = 0;
        let taxAmount = 0;
        const computedItems = data.items.map((item) => {
            const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
            subtotal += (item.qty * item.unitPrice) - item.discount;
            taxAmount += item.taxAmount;
            return { ...item, total: itemTotal };
        });
        const total = subtotal + taxAmount - data.discount;
        const result = await db_1.default.$transaction(async (tx) => {
            // 1. Delete old items
            await tx.purchaseItem.deleteMany({
                where: { purchaseInvoiceId: id }
            });
            // 2. Update bill and create new items
            const updated = await tx.purchaseInvoice.update({
                where: { id: id },
                data: {
                    partyId: data.partyId,
                    poId: data.poId,
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
            // Delete old stock entries for this bill
            await tx.stockEntry.deleteMany({
                where: { businessId: user.businessId, reference: existing.number }
            });
            // If new status is RECEIVED, add stock
            if (isPurchaseReceived(data.status)) {
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
                                type: "IN",
                                qty: item.qty,
                                cost: item.unitPrice,
                                reference: updated.number,
                                notes: `Purchased via Bill ${updated.number} (Updated)`
                            }
                        });
                        // Update purchase price in product master
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { purchasePrice: item.unitPrice }
                        });
                    }
                }
            }
            return updated;
        });
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.errors });
        res.status(500).json({ error: error.message });
    }
});
// Update Purchase Status
router.patch("/invoices/:id/status", async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { status } = zod_1.z.object({
            status: zod_1.z.enum(["DRAFT", "PENDING", "RECEIVED", "PARTIAL", "PAID", "OVERDUE"])
        }).parse(req.body);
        const existing = await db_1.default.purchaseInvoice.findFirst({
            where: { id: id, businessId: user.businessId },
            include: { items: true }
        });
        if (!existing)
            return res.status(404).json({ error: "Purchase Bill not found" });
        const result = await db_1.default.$transaction(async (tx) => {
            const updated = await tx.purchaseInvoice.update({
                where: { id: id },
                data: { status },
                include: { items: true, party: true }
            });
            // Stock Reconciliation
            const wasReceived = isPurchaseReceived(existing.status);
            const isReceived = isPurchaseReceived(status);
            if (!wasReceived && isReceived) {
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
                                type: "IN",
                                qty: item.qty,
                                cost: item.unitPrice,
                                reference: updated.number,
                                notes: `Purchased via Bill ${updated.number} (Status Change)`
                            }
                        });
                        // Update purchase price in product master
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { purchasePrice: item.unitPrice }
                        });
                    }
                }
            }
            else if (wasReceived && !isReceived) {
                // Remove stock entries
                await tx.stockEntry.deleteMany({
                    where: { businessId: user.businessId, reference: updated.number }
                });
            }
            return updated;
        });
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.errors });
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=purchases.routes.js.map