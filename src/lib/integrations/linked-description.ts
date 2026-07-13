import { TaskLinkedApp } from "@prisma/client";
import type { ResolvedLink } from "@/lib/integrations/link-resolver";

const LINKED_APP_LABELS: Partial<Record<TaskLinkedApp, string>> = {
  [TaskLinkedApp.SALES]: "Deal",
  [TaskLinkedApp.ASSEMBLY]: "Assembly",
  [TaskLinkedApp.FACTORY]: "Factory batch",
  [TaskLinkedApp.RP]: "RP request",
  [TaskLinkedApp.MRP]: "MRP batch",
};

export function formatLinkedEntityDescription(
  resolved: ResolvedLink,
  linkedApp: TaskLinkedApp,
  userDescription?: string
): string {
  const prefix = LINKED_APP_LABELS[linkedApp] ?? "Linked item";
  const linkBlock = `${prefix}: ${resolved.displayLabel}\n${resolved.deepLinkUrl}`;
  const notes = userDescription?.trim() ?? "";

  if (!notes || notes.includes(resolved.deepLinkUrl)) {
    return linkBlock;
  }

  return `${linkBlock}\n\n${notes}`;
}
