import { z } from "zod";

export const SubmitEventBody = z.object({
  title: z.string().min(3),
  eventDate: z.string().min(1),
  eventTime: z.string().optional(),
  villageId: z.number().int().optional(),
  location: z.string().optional(),
  description: z.string().min(20),
  imageUrl: z.string().optional(),
  contactInfo: z.string().optional(),
  senderName: z.string().min(2),
  consentGiven: z.boolean(),
  website: z.string().optional(),
});

export const UpdateEventSubmissionBody = z.object({
  status: z.enum(["approved", "rejected"]),
});
