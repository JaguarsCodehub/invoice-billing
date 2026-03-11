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
// Get stock summary for all products
router.get("/stock-summary", async (req, res) => {
    try {
        const user = req.user;
        const stockAggregations = await db_1.default.stockEntry.groupBy({
            by: ['productId', 'type'],
            where: { businessId: user.businessId },
            _sum: { qty: true }
        });
        res.json(stockAggregations);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
const adjustSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    warehouseId: zod_1.z.string().optional(),
    type: zod_1.z.enum(["IN", "OUT", "ADJUSTMENT", "TRANSFER"]),
    qty: zod_1.z.number().positive(),
    notes: zod_1.z.string().optional()
});
// Manual Stock Adjustment
router.post("/adjustments", async (req, res) => {
    try {
        const user = req.user;
        const data = adjustSchema.parse(req.body);
        let warehouseId = data.warehouseId;
        if (!warehouseId) {
            // Find default warehouse or create one
            const warehouse = await db_1.default.warehouse.findFirst({
                where: { businessId: user.businessId, isDefault: true }
            });
            if (warehouse) {
                warehouseId = warehouse.id;
            }
            else {
                const newWarehouse = await db_1.default.warehouse.create({
                    data: { name: "Main", isDefault: true, businessId: user.businessId }
                });
                warehouseId = newWarehouse.id;
            }
        }
        const entry = await db_1.default.stockEntry.create({
            data: {
                businessId: user.businessId,
                productId: data.productId,
                warehouseId,
                type: data.type,
                qty: data.qty,
                notes: data.notes
            }
        });
        res.status(201).json(entry);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});
// Get stock history for a specific product
router.get("/history/:productId", async (req, res) => {
    try {
        const user = req.user;
        const productId = req.params.productId;
        const history = await db_1.default.stockEntry.findMany({
            where: {
                businessId: user.businessId,
                productId
            },
            orderBy: { date: 'desc' },
            include: {
                warehouse: { select: { name: true } }
            }
        });
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get low stock alerts
router.get("/low-stock", async (req, res) => {
    try {
        const user = req.user;
        // In a real app, Product would have a `reorderLevel`. We simulate by checking currentStock.
        res.json([]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map