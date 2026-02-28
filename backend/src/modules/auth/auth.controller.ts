import { Request, Response } from "express";
import { z } from "zod";
import * as authService from "./auth.service";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  businessName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.registerUser(data);
    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.loginUser(data);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(401).json({ error: error.message });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    // req.user is populated by authenticate middleware
    const user = req.user as any;
    const result = await authService.getUserProfile(user.id);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};
