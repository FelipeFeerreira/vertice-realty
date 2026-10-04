import { z } from "zod";

const phoneSchema = z.string().trim().max(30).refine(value => /^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 10 && value.replace(/\D/g, "").length <= 15, "Enter a valid phone number with area code");
const optionalPhone = z.preprocess(value => value === "" ? undefined : value, phoneSchema.optional().nullable());

export const chatRequestSchema = z.object({
  sessionId: z.string().min(8).max(80),
  requestId: z.string().uuid().optional(),
  state: z.unknown(),
  input: z.string().max(600),
  inputType: z.enum(["text", "option"]).default("text"),
  propertyContext: z.string().max(120).nullish(),
});

export const leadCreateSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(160),
  phone: optionalPhone,
  message: z.string().max(1000).optional().nullable(),
  propertySlug: z.string().max(120).optional().nullable(),
  source: z.enum(["AI_CHATBOT", "PROPERTY_PAGE", "CONTACT_PAGE", "SCHEDULE_PAGE"]).default("PROPERTY_PAGE"),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(160),
  phone: optionalPhone,
  subject: z.string().max(160).optional().nullable(),
  message: z.string().trim().min(10, "Please tell us a little more about what you need").max(2000),
});

export const appointmentSchema = z.object({
  propertySlug: z.string().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time"),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(160),
  phone: phoneSchema,
  note: z.string().max(600).optional().nullable(),
  leadId: z.string().max(40).optional().nullable(),
});

export const handoffSchema = z.object({
  leadId: z.string().min(1).max(40),
  channel: z.enum(["whatsapp", "call"]).default("whatsapp"),
});

export const analyticsSchema = z.object({
  event: z.string().min(2).max(60),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
