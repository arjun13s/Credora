import { z } from "zod";

// --- Shared enums ---

const personaEnum = z.enum(["newcomer", "gig_worker", "student", "contractor"]);

const consentSourceEnum = z.enum([
  "identity_check",
  "bank_connection",
  "income_docs",
  "housing_docs",
  "report_share",
]);

const consentStatusEnum = z.enum(["active", "revoked"]);

const reviewDispositionEnum = z.enum([
  "Proceed to manual approval review",
  "Needs more information",
  "Continue manual review",
]);

const actorEnum = z.enum(["applicant", "reviewer", "system"]);

// --- Request schemas ---

export const applicantInputSchema = z.object({
  applicantName: z.string().min(1, "Name is required").max(200),
  applicantEmail: z.string().email("Invalid email"),
  persona: personaEnum,
  targetRent: z.number().positive("Target rent must be positive"),
  monthlyIncome: z.number().nonnegative(),
  averageCushion: z.number().nonnegative(),
  incomeRegularity: z.number().min(0).max(100),
  rentPaymentStreakMonths: z.number().int().nonnegative(),
  utilityPaymentStreakMonths: z.number().int().nonnegative(),
  residencyMonths: z.number().int().nonnegative(),
  overdraftsLast90Days: z.number().int().nonnegative(),
  signalRecencyDays: z.number().int().nonnegative(),
  identityVerified: z.boolean(),
  accountOwnerMatch: z.boolean(),
  bankConnected: z.boolean(),
  payStubUploaded: z.boolean(),
  landlordReference: z.boolean(),
  contradictionDetected: z.boolean(),
  housingDocumentNames: z.array(z.string().max(500)),
  incomeDocumentNames: z.array(z.string().max(500)),
  consentSources: z.array(consentSourceEnum),
  notes: z.string().max(5000),
});

export const disputeSchema = z.object({
  field: z.string().min(1, "Field is required").max(200),
  explanation: z.string().min(1, "Explanation is required").max(2000),
});

export const consentUpdateSchema = z.object({
  source: consentSourceEnum,
  status: consentStatusEnum,
});

export const reviewSchema = z.object({
  reviewerName: z.string().min(1, "Reviewer name is required").max(200),
  disposition: reviewDispositionEnum,
  notes: z.string().max(5000),
});

export const accessLogSchema = z.object({
  actor: actorEnum,
  action: z.string().min(1).max(200),
  detail: z.string().max(2000),
});

export const plaidExchangeSchema = z.object({
  public_token: z.string().min(1, "Public token is required"),
});

// --- Parse helper ---

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: Response } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: Response.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 },
      ),
    };
  }
  return { success: true, data: result.data };
}
