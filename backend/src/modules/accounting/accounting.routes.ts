import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";

const router = Router();
router.use(authenticate);

// Get Chart of Accounts
router.get("/accounts", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const accounts = await prisma.account.findMany({
      where: { businessId: user.businessId },
      orderBy: { type: "asc" }
    });
    res.json(accounts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Journal Entries
router.get("/journals", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const journals = await prisma.journalEntry.findMany({
      where: { businessId: user.businessId },
      include: { lines: { include: { account: true } } },
      orderBy: { date: "desc" }
    });
    res.json(journals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
