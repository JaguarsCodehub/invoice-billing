import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const JWT_EXPIRES_IN = "7d";

export const registerUser = async (data: any) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  // Use a transaction since we create Business + User together
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Business
    const business = await tx.business.create({
      data: {
        name: data.businessName,
      }
    });

    // 2. Create User linked to Business
    const user = await tx.user.create({
      data: {
        businessId: business.id,
        name: data.name,
        email: data.email,
        passwordHash,
        role: "OWNER"
      }
    });

    return { user, business };
  });

  // Generate Token
  const token = jwt.sign(
    { id: result.user.id, businessId: result.business.id, role: result.user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      businessId: result.business.id
    },
    business: result.business
  };
};

export const loginUser = async (data: any) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { business: true }
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // Update last active
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActive: new Date() }
  });

  const token = jwt.sign(
    { id: user.id, businessId: user.businessId, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId
    },
    business: user.business
  };
};

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { business: true }
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    business: user.business
  };
};
