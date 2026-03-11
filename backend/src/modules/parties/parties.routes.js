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
const partySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    type: zod_1.z.enum(["CUSTOMER", "SUPPLIER", "BOTH"]),
    gstin: zod_1.z.string().optional().nullable(),
    pan: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    creditLimit: zod_1.z.number().optional().nullable(),
    paymentTerms: zod_1.z.string().optional().nullable(),
    openingBalance: zod_1.z.number().optional().default(0),
});
// Create Party
router.post("/", async (req, res) => {
    try {
        const user = req.user;
        const data = partySchema.parse(req.body);
        const party = await db_1.default.party.create({
            data: {
                ...data,
                businessId: user.businessId,
            }
        });
        res.status(201).json(party);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});
// Get all parties
router.get("/", async (req, res) => {
    try {
        const user = req.user;
        const { type } = req.query; // ?type=CUSTOMER
        const parties = await db_1.default.party.findMany({
            where: {
                businessId: user.businessId,
                ...(type ? { type: type } : {})
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(parties);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get party by ID
router.get("/:id", async (req, res) => {
    try {
        const user = req.user;
        const party = await db_1.default.party.findFirst({
            where: { id: req.params.id, businessId: user.businessId }
        });
        if (!party)
            return res.status(404).json({ error: "Party not found" });
        res.json(party);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update party
router.patch("/:id", async (req, res) => {
    try {
        const user = req.user;
        const data = partySchema.partial().parse(req.body);
        const party = await db_1.default.party.update({
            where: { id: req.params.id, businessId: user.businessId },
            data
        });
        res.json(party);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});
// Delete party
router.delete("/:id", async (req, res) => {
    try {
        const user = req.user;
        await db_1.default.party.delete({
            where: { id: req.params.id, businessId: user.businessId }
        });
        res.json({ message: "Party deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Cannot delete party with existing transactions" });
    }
});
exports.default = router;
//# sourceMappingURL=parties.routes.js.map