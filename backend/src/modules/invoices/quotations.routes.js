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
const quoteItemSchema = zod_1.z.object({
    productId: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string(),
    qty: zod_1.z.number().positive(),
    unit: zod_1.z.string().default("PCS"),
    unitPrice: zod_1.z.number().nonnegative(),
    discount: zod_1.z.number().nonnegative().default(0),
    taxAmount: zod_1.z.number().nonnegative().default(0),
});
const quotationSchema = zod_1.z.object({
    partyId: zod_1.z.string(),
    number: zod_1.z.string(),
    date: zod_1.z.string(),
    validUntil: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "INVOICED"]).default("DRAFT"),
    discount: zod_1.z.number().default(0),
    notes: zod_1.z.string().optional().nullable(),
    items: zod_1.z.array(quoteItemSchema).min(1),
});
// Create Quotation
router.post("/", async (req, res) => {
    try {
        const user = req.user;
        const data = quotationSchema.parse(req.body);
        let subtotal = 0;
        let taxAmount = 0;
        const computedItems = data.items.map(item => {
            const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
            subtotal += (item.qty * item.unitPrice) - item.discount;
            taxAmount += item.taxAmount;
            return { ...item, total: itemTotal };
        });
        const total = subtotal + taxAmount - data.discount;
        const quotation = await db_1.default.quotation.create({
            data: {
                businessId: user.businessId,
                partyId: data.partyId,
                number: data.number,
                date: new Date(data.date),
                validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
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
        res.status(201).json(quotation);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.errors });
        res.status(500).json({ error: error.message });
    }
});
// Get Quotations
router.get("/", async (req, res) => {
    try {
        const user = req.user;
        const { status, partyId } = req.query;
        const quotations = await db_1.default.quotation.findMany({
            where: {
                businessId: user.businessId,
                ...(status ? { status: status } : {}),
                ...(partyId ? { partyId: partyId } : {})
            },
            include: {
                party: { select: { name: true, type: true } }
            },
            orderBy: { date: "desc" }
        });
        res.json(quotations);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get quotation by ID
router.get("/:id", async (req, res) => {
    try {
        const user = req.user;
        const quotation = await db_1.default.quotation.findFirst({
            where: { id: req.params.id, businessId: user.businessId },
            include: {
                items: true,
                party: true
            }
        });
        if (!quotation)
            return res.status(404).json({ error: "Quotation not found" });
        res.json(quotation);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update quotation
router.put("/:id", async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const data = quotationSchema.parse(req.body);
        const existing = await db_1.default.quotation.findFirst({
            where: { id: id, businessId: user.businessId }
        });
        if (!existing)
            return res.status(404).json({ error: "Quotation not found" });
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
            // Delete old items
            await tx.quotationItem.deleteMany({
                where: { quotationId: id }
            });
            // Update quotation and create new items
            const updated = await tx.quotation.update({
                where: { id: id },
                data: {
                    partyId: data.partyId,
                    number: data.number,
                    date: new Date(data.date),
                    validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
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
// Update Quotation Status
router.patch("/:id/status", async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { status } = zod_1.z.object({
            status: zod_1.z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "INVOICED"])
        }).parse(req.body);
        const updated = await db_1.default.quotation.update({
            where: { id: id, businessId: user.businessId },
            data: { status: status },
            include: { items: true, party: true }
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.errors });
        res.status(500).json({ error: error.message });
    }
});
// Convert to Invoice
router.post("/:id/convert-to-invoice", async (req, res) => {
    try {
        const user = req.user;
        const quote = await db_1.default.quotation.findFirst({
            where: { id: req.params.id, businessId: user.businessId },
            include: { items: true }
        });
        if (!quote)
            return res.status(404).json({ error: "Quotation not found" });
        const result = await db_1.default.$transaction(async (tx) => {
            const invoice = await tx.invoice.create({
                data: {
                    businessId: user.businessId,
                    partyId: quote.partyId,
                    type: "TAX_INVOICE",
                    number: `INV-${quote.number}`,
                    date: new Date(),
                    status: "DRAFT",
                    subtotal: quote.subtotal,
                    taxAmount: quote.taxAmount,
                    discount: quote.discount,
                    total: quote.total,
                    notes: quote.notes,
                    items: {
                        create: quote.items.map((i) => ({
                            productId: i.productId,
                            description: i.description,
                            qty: i.qty,
                            unit: i.unit,
                            unitPrice: i.unitPrice,
                            discount: i.discount,
                            taxAmount: i.taxAmount,
                            total: i.total
                        }))
                    }
                }
            });
            await tx.quotation.update({
                where: { id: quote.id },
                data: { status: "INVOICED" }
            });
            return invoice;
        });
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=quotations.routes.js.map