"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const db_1 = __importDefault(require("../../config/db"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Get Chart of Accounts
router.get("/accounts", async (req, res) => {
    try {
        const user = req.user;
        const accounts = await db_1.default.account.findMany({
            where: { businessId: user.businessId },
            orderBy: { type: "asc" }
        });
        res.json(accounts);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get Journal Entries
router.get("/journals", async (req, res) => {
    try {
        const user = req.user;
        const journals = await db_1.default.journalEntry.findMany({
            where: { businessId: user.businessId },
            include: { lines: { include: { account: true } } },
            orderBy: { date: "desc" }
        });
        res.json(journals);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=accounting.routes.js.map