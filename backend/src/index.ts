import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Routes
import authRoutes from "./modules/auth/auth.routes";
import businessRoutes from "./modules/business/business.routes";
import partiesRoutes from "./modules/parties/parties.routes";
import productsRoutes from "./modules/products/products.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import invoicesRoutes from "./modules/invoices/invoices.routes";
import quotationsRoutes from "./modules/invoices/quotations.routes";
import purchasesRoutes from "./modules/purchases/purchases.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import taxesRoutes from "./modules/taxes/taxes.routes";
import accountingRoutes from "./modules/accounting/accounting.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/business", businessRoutes);
app.use("/api/v1/parties", partiesRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/invoices", invoicesRoutes);
app.use("/api/v1/quotations", quotationsRoutes);
app.use("/api/v1/purchases", purchasesRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/taxes", taxesRoutes);
app.use("/api/v1/accounting", accountingRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "BillFlow API is running" });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
