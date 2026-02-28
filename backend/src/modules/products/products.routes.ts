import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";
import { z } from "zod";

const router = Router();
router.use(authenticate);

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  hsnSac: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  unit: z.string().default("PCS"),
  purchasePrice: z.number().default(0),
  salePrice: z.number().default(0),
  taxGroupId: z.string().optional().nullable(),
  trackInventory: z.boolean().default(true),
});

// Create Product
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = productSchema.parse(req.body);

    const product = await prisma.product.create({
      data: {
        ...data,
        businessId: user.businessId,
      }
    });
    
    res.status(201).json(product);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get all products
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const products = await prisma.product.findMany({
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
    const stockAggregations = await prisma.stockEntry.groupBy({
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
        } else if (entry.type === 'OUT') {
          currentStock -= qty;
        }
      }

      return {
        ...p,
        currentStock
      };
    });

    res.json(productsWithStock);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const product = await prisma.product.findFirst({
      where: { id: req.params.id as string, businessId: user.businessId },
      include: { taxGroup: true }
    });
    
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = productSchema.partial().parse(req.body);

    const product = await prisma.product.update({
      where: { id: req.params.id as string, businessId: user.businessId },
      data
    });
    
    res.json(product);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    await prisma.product.delete({
      where: { id: req.params.id as string, businessId: user.businessId }
    });
    res.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Cannot delete product with existing transactions" });
  }
});

export default router;
