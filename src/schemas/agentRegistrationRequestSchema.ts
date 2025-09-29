import { z } from 'zod';

export const agentRegistrationRequestSchema = z.object({
  adminMsg: z.string().min(10),
});
