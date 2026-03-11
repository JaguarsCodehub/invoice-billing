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
// List Tax Groups
router.get("/", async (req, res) => {
    try {
        const user = req.user;
        const taxGroups = await db_1.default.taxGroup.findMany({
            where: { businessId: user.businessId }
        });
        const formattedGroups = taxGroups.map(tg => {
            const comps = tg.components;
            const totalRate = comps.reduce((sum, c) => sum + Number(c.rate), 0);
            const description = comps.map(c => `${c.name} @ ${c.rate}%`).join(" + ");
            return { ...tg, rate: totalRate, description };
        });
        res.json(formattedGroups);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
const taxGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    components: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        rate: zod_1.z.number().nonnegative()
    })).min(1)
});
// Create Tax Group (e.g., GST 18%)
router.post("/", async (req, res) => {
    try {
        const user = req.user;
        const data = taxGroupSchema.parse(req.body);
        const taxGroup = await db_1.default.taxGroup.create({
            data: {
                businessId: user.businessId,
                name: data.name,
                components: data.components
            }
        });
        res.status(201).json(taxGroup);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.errors });
        res.status(500).json({ error: error.message });
    }
});
// Tax Calculation Engine API
// Realistically, the frontend will compute taxes for live preview, and the backend verifies on save.
// This endpoint provides tax calculation as a service if the frontend requests it explicitly.
router.post("/calculate", async (req, res) => {
    try {
        const { subtotal, stateSupply, items } = req.body;
        // stateSupply: "INTRA" | "INTER"
        // Simplistic GST Calc Engine
        let totalTax = 0;
        const itemTaxes = items.map((item) => {
            const taxable = item.qty * item.unitPrice - (item.discount || 0);
            let taxAmount = 0;
            if (item.taxGroup) {
                // Evaluate components dynamically
                for (const comp of item.taxGroup.components) {
                    if (stateSupply === 'INTRA') {
                        if (comp.name.includes("CGST") || comp.name.includes("SGST")) {
                            taxAmount += (taxable * comp.rate) / 100;
                        }
                    }
                    else if (stateSupply === 'INTER') {
                        if (comp.name.includes("IGST")) {
                            taxAmount += (taxable * comp.rate) / 100;
                        }
                    }
                    else {
                        taxAmount += (taxable * comp.rate) / 100;
                    }
                }
            }
            totalTax += taxAmount;
            return { ...item, taxAmount };
        });
        res.json({ totalTax, items: itemTaxes });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=taxes.routes.js.map