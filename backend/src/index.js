"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
require("dotenv/config");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
// Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const business_routes_1 = __importDefault(require("./modules/business/business.routes"));
const parties_routes_1 = __importDefault(require("./modules/parties/parties.routes"));
const products_routes_1 = __importDefault(require("./modules/products/products.routes"));
const inventory_routes_1 = __importDefault(require("./modules/inventory/inventory.routes"));
const invoices_routes_1 = __importDefault(require("./modules/invoices/invoices.routes"));
const quotations_routes_1 = __importDefault(require("./modules/invoices/quotations.routes"));
const purchases_routes_1 = __importDefault(require("./modules/purchases/purchases.routes"));
const payments_routes_1 = __importDefault(require("./modules/payments/payments.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const taxes_routes_1 = __importDefault(require("./modules/taxes/taxes.routes"));
const accounting_routes_1 = __importDefault(require("./modules/accounting/accounting.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/business", business_routes_1.default);
app.use("/api/v1/parties", parties_routes_1.default);
app.use("/api/v1/products", products_routes_1.default);
app.use("/api/v1/inventory", inventory_routes_1.default);
app.use("/api/v1/invoices", invoices_routes_1.default);
app.use("/api/v1/quotations", quotations_routes_1.default);
app.use("/api/v1/purchases", purchases_routes_1.default);
app.use("/api/v1/payments", payments_routes_1.default);
app.use("/api/v1/reports", reports_routes_1.default);
app.use("/api/v1/taxes", taxes_routes_1.default);
app.use("/api/v1/accounting", accounting_routes_1.default);
app.use("/api/v1/dashboard", dashboard_routes_1.default);
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "BillFlow API is running" });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map