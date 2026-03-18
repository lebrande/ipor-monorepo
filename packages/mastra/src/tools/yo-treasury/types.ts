import { z } from 'zod';

/** Shared schema for existing pending actions passed to action tools */
export const existingActionSchema = z.object({
  id: z.string(),
  fuseActions: z.array(z.object({ fuse: z.string(), data: z.string() })),
});
