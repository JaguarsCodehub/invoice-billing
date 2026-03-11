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
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().optional().nullable(),
    sku: zod_1.z.string().optional().nullable(),
    hsnSac: zod_1.z.string().optional().nullable(),
    categoryId: zod_1.z.string().optional().nullable(),
    unit: zod_1.z.string().default("PCS"),
    purchasePrice: zod_1.z.number().default(0),
    salePrice: zod_1.z.number().default(0),
    taxGroupId: zod_1.z.string().optional().nullable(),
    trackInventory: zod_1.z.boolean().default(true),
});
// Create Product
router.post("/", async (req, res) => {
    try {
        const user = req.user;
        const data = productSchema.parse(req.body);
        const product = await db_1.default.product.create({
            data: {
                ...data,
                businessId: user.businessId,
            }
        });
        res.status(201).json(product);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});
// Get all products
router.get("/", async (req, res) => {
    try {
        const user = req.user;
        const products = await db_1.default.product.findMany({
            where: { businessId: user.businessId },
            include: {
                taxGroup: true
            },
            orderBy: { createdAt: "desc" }
        });
        // Also attach summarized stock per product
        // For Phase 1, we can compute stock on the fly or fetch from stock entries
        // Since we don't have a materialized 'currentStock' column in Product (per PRD we have StockEntry)
        // We will aggregate it. 
        // To make it efficient, we group by productId
        const stockAggregations = await db_1.default.stockEntry.groupBy({
            by: ['productId', 'type'],
            where: { businessId: user.businessId },
            _sum: { qty: true }
        });
        const productsWithStock = products.map(p => {
            let currentStock = 0;
            const stockEntries = stockAggregations.filter(agg => agg.productId === p.id);
            for (const entry of stockEntries) {
                const qty = Number(entry._sum.qty || 0);
                if (entry.type === 'IN' || entry.type === 'ADJUSTMENT') {
                    currentStock += qty; // Assuming adjustment is absolute or relative? We'll treat IN/OUT simply.
                    // Actually, standard is IN/ADJUSTMENT adds (if positive), OUT/TRANSFER reduces
                }
                else if (entry.type === 'OUT') {
                    currentStock -= qty;
                }
            }
            return {
                ...p,
                currentStock
            };
        });
        res.json(productsWithStock);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get product by ID
router.get("/:id", async (req, res) => {
    try {
        const user = req.user;
        const product = await db_1.default.product.findFirst({
            where: { id: req.params.id, businessId: user.businessId },
            include: { taxGroup: true }
        });
        if (!product)
            return res.status(404).json({ error: "Product not found" });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update product
router.patch("/:id", async (req, res) => {
    try {
        const user = req.user;
        const data = productSchema.partial().parse(req.body);
        const product = await db_1.default.product.update({
            where: { id: req.params.id, businessId: user.businessId },
            data
        });
        res.json(product);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});
// Delete product
router.delete("/:id", async (req, res) => {
    try {
        const user = req.user;
        await db_1.default.product.delete({
            where: { id: req.params.id, businessId: user.businessId }
        });
        res.json({ message: "Product deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Cannot delete product with existing transactions" });
    }
});
exports.default = router;
//# sourceMappingURL=products.routes.js.map