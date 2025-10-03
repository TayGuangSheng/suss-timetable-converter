import { z } from "zod";

export const EventZ = z.object({
  id: z.string(),
  moduleCode: z.string(),
  moduleName: z.string().optional(),
  group: z.string().optional(),
  date: z.string(),
  start: z.string(),
  end: z.string(),
  venue: z.string().optional(),
  semesterType: z.string().optional(),
  remarks: z.string().optional(),
  sourcePage: z.number().optional()
});
export type Event = z.infer<typeof EventZ>;
