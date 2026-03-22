import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

const datasourceUrl = `file:${path.join(process.cwd(), "prisma/dev.db")}`;

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ?? new PrismaClient({ datasourceUrl });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
