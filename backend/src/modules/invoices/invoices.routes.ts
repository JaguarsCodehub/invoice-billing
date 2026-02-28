import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";
import { z } from "zod";

const router = Router();
router.use(authenticate);

const invoiceItemSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string(),
  qty: z.number().positive(),
  unit: z.string().default("PCS"),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
});

const invoiceSchema = z.object({
  partyId: z.string(),
  type: z.enum(["TAX_INVOICE", "PROFORMA", "CREDIT_NOTE", "DEBIT_NOTE", "DELIVERY_CHALLAN"]),
  number: z.string(),
  date: z.string(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
  discount: z.number().default(0),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1),
});

// Create Invoice
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = invoiceSchema.parse(req.body);

    // Calculate subtotal, tax and total
    let subtotal = 0;
    let taxAmount = 0;

    const computedItems = data.items.map(item => {
      const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
      subtotal += (item.qty * item.unitPrice) - item.discount;
      taxAmount += item.taxAmount;
      return {
        ...item,
        total: itemTotal
      };
    });

    const total = subtotal + taxAmount - data.discount;

    // Transaction to create invoice and deduct stock if needed
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          businessId: user.businessId,
          partyId: data.partyId,
          type: data.type,
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

      // If TAX_INVOICE and status changes to SENT/PARTIAL/PAID, deduct stock
      if (data.type === 'TAX_INVOICE' && ['SENT', 'PARTIAL', 'PAID'].includes(data.status)) {
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
                type: "OUT",
                qty: item.qty,
                reference: invoice.number,
                notes: `Sold via Invoice ${invoice.number}`
              }
            });
          }
        }
      }

      return invoice;
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get all invoices
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { status, partyId } = req.query;

    const invoices = await prisma.invoice.findMany({
      where: { 
        businessId: user.businessId,
        ...(status ? { status: status as any } : {}),
        ...(partyId ? { partyId: typeof partyId === 'string' ? partyId : (partyId as string[])[0] } : {})
      },
      include: {
        party: { select: { name: true, type: true } }
      },
      orderBy: { date: "desc" }
    });

    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoice by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id as string, businessId: user.businessId },
      include: { 
        items: true,
        party: true,
        payments: true
      }
    });

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update invoice
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    const data = invoiceSchema.parse(req.body);

    const existing = await prisma.invoice.findFirst({
      where: { id: id as string, businessId: user.businessId }
    });

    if (!existing) return res.status(404).json({ error: "Invoice not found" });

    let subtotal = 0;
    let taxAmount = 0;

    const computedItems = data.items.map((item: any) => {
      const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
      subtotal += (item.qty * item.unitPrice) - item.discount;
      taxAmount += item.taxAmount;
      return {
        ...item,
        total: itemTotal
      };
    });

    const total = subtotal + taxAmount - data.discount;

    const result = await prisma.$transaction(async (tx: any) => {
      // Delete old items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id as string }
      });

      // Update invoice and create new items
      const updated = await tx.invoice.update({
        where: { id: id as string },
        data: {
          partyId: data.partyId,
          type: data.type,
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

      return updated;
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
