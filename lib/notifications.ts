import { prisma } from "@/lib/prisma";

interface CreateNotifArgs {
  organizationId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  userId?: string;
}

/** Fire-and-forget notification creator. Never throws. */
export async function createNotification(args: CreateNotifArgs): Promise<void> {
  await prisma.notification.create({ data: args }).catch(() => {});
}
