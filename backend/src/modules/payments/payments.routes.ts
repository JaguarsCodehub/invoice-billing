import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";
import { z } from "zod";

const router = Router();
router.use(authenticate);

const paymentSchema = z.object({
  invoiceId: z.string().optional().nullable(),
  partyId: z.string(),
  amount: z.number().positive(),
  date: z.string(),
  mode: z.enum(["CASH", "CHEQUE", "UPI", "NEFT_RTGS", "CARD", "CREDIT", "ADVANCE"]),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Record a Payment
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = paymentSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          businessId: user.businessId,
          invoiceId: data.invoiceId,
          partyId: data.partyId,
          amount: data.amount,
          date: new Date(data.date),
          mode: data.mode,
          reference: data.reference,
          notes: data.notes,
        }
      });

      // Update invoice status if applicable
      if (data.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: data.invoiceId },
          include: { payments: true }
        });

        if (invoice) {
          // Calculate total paid so far including this payment because include.payments might not have picked up the un-committed one depending on prisma transaction isolation, but wait, the payment is created in the same tx, so findUnique might return it or not depending on context. Best to just sum from DB explicitly.
          const allPayments = await tx.payment.findMany({
            where: { invoiceId: invoice.id, status: "SUCCESS" }
          });
          const totalPaid = allPayments.reduce((acc, p) => acc + Number(p.amount), 0);
          
          let newStatus = invoice.status;
          if (totalPaid >= Number(invoice.total)) {
            newStatus = "PAID";
          } else if (totalPaid > 0) {
            newStatus = "PARTIAL";
          }

          if (newStatus !== invoice.status) {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { status: newStatus }
            });
          }
        }
      }

      return payment;
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
    res.status(500).json({ error: error.message });
  }
});

// Get payments
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { partyId, invoiceId } = req.query;

    const payments = await prisma.payment.findMany({
      where: {
        businessId: user.businessId,
        ...(partyId ? { partyId: partyId as string } : {}),
        ...(invoiceId ? { invoiceId: invoiceId as string } : {})
      },
      include: {
        party: { select: { name: true, type: true } },
        invoice: { select: { number: true } }
      },
      orderBy: { date: "desc" }
    });

    const formattedPayments = payments.map(p => ({
      ...p,
      number: `PAY-${p.id.substring(0, 6).toUpperCase()}`,
      type: p.party?.type === 'SUPPLIER' ? 'OUT' : 'IN'
    }));

    res.json(formattedPayments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
