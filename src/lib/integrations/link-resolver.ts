import { TaskLinkedApp } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ResolvedLink = {
  displayLabel: string;
  deepLinkUrl: string;
};

export async function resolveExternalLink(
  linkedApp: TaskLinkedApp,
  entityId: string
): Promise<ResolvedLink | null> {
  switch (linkedApp) {
    case TaskLinkedApp.SALES: {
      const deal = await prisma.deal.findUnique({
        where: { id: entityId },
        select: { id: true, quoteNumber: true, clientName: true, dealId: true },
      });
      if (!deal) return null;
      const label = deal.dealId
        ? `${deal.dealId} — ${deal.clientName}`
        : `${deal.quoteNumber} — ${deal.clientName}`;
      return {
        displayLabel: label,
        deepLinkUrl: `https://sales.meavo.app/deals/${deal.id}`,
      };
    }
    case TaskLinkedApp.FACTORY: {
      const batch = await prisma.factoryProductionBatch.findUnique({
        where: { id: entityId },
        select: { id: true, batchCode: true },
      });
      if (!batch) return null;
      return {
        displayLabel: batch.batchCode,
        deepLinkUrl: `https://factory.meavo.app/batches/${batch.id}`,
      };
    }
    case TaskLinkedApp.RP: {
      const request = await prisma.rpRequest.findUnique({
        where: { id: entityId },
        select: { id: true, rpNum: true, model: true },
      });
      if (!request) return null;
      return {
        displayLabel: `${request.rpNum}${request.model ? ` — ${request.model}` : ""}`,
        deepLinkUrl: `https://rp.meavo.app/dashboard?rp=${request.rpNum}`,
      };
    }
    case TaskLinkedApp.ASSEMBLY: {
      const assembly = await prisma.assembly.findUnique({
        where: { id: entityId },
        select: { id: true, dealId: true },
      });
      if (!assembly) return null;
      return {
        displayLabel: assembly.dealId,
        deepLinkUrl: `https://assembly.meavo.app/assemblies/${assembly.dealId}`,
      };
    }
    case TaskLinkedApp.MRP: {
      const batch = await prisma.mrpManufacturingBatch.findUnique({
        where: { id: entityId },
        select: { id: true, name: true },
      });
      if (!batch) return null;
      return {
        displayLabel: batch.name,
        deepLinkUrl: `https://mrp.meavo.app/batches/${batch.id}`,
      };
    }
    default:
      return null;
  }
}

export async function searchLinkableEntities(
  linkedApp: TaskLinkedApp,
  query: string
) {
  const q = query.trim();
  if (!q) return [];

  switch (linkedApp) {
    case TaskLinkedApp.SALES:
      return prisma.deal.findMany({
        where: {
          OR: [
            { quoteNumber: { contains: q, mode: "insensitive" } },
            { clientName: { contains: q, mode: "insensitive" } },
            { dealId: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: { id: true, quoteNumber: true, clientName: true, dealId: true },
      }).then((rows) =>
        rows.map((r) => ({
          id: r.id,
          label: r.dealId
            ? `${r.dealId} — ${r.clientName}`
            : `${r.quoteNumber} — ${r.clientName}`,
        }))
      );
    case TaskLinkedApp.FACTORY:
      return prisma.factoryProductionBatch.findMany({
        where: { batchCode: { contains: q, mode: "insensitive" } },
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: { id: true, batchCode: true },
      }).then((rows) => rows.map((r) => ({ id: r.id, label: r.batchCode })));
    case TaskLinkedApp.RP:
      return prisma.rpRequest.findMany({
        where: { rpNum: { contains: q, mode: "insensitive" } },
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: { id: true, rpNum: true, model: true },
      }).then((rows) =>
        rows.map((r) => ({
          id: r.id,
          label: `${r.rpNum}${r.model ? ` — ${r.model}` : ""}`,
        }))
      );
    case TaskLinkedApp.ASSEMBLY:
      return prisma.assembly.findMany({
        where: { dealId: { contains: q, mode: "insensitive" } },
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: { id: true, dealId: true },
      }).then((rows) => rows.map((r) => ({ id: r.id, label: r.dealId })));
    case TaskLinkedApp.MRP:
      return prisma.mrpManufacturingBatch.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true },
      }).then((rows) => rows.map((r) => ({ id: r.id, label: r.name })));
    default:
      return [];
  }
}

export function entityTypeForApp(linkedApp: TaskLinkedApp): string {
  switch (linkedApp) {
    case TaskLinkedApp.SALES:
      return "Deal";
    case TaskLinkedApp.FACTORY:
      return "FactoryProductionBatch";
    case TaskLinkedApp.RP:
      return "RpRequest";
    case TaskLinkedApp.ASSEMBLY:
      return "Assembly";
    case TaskLinkedApp.MRP:
      return "MrpManufacturingBatch";
    default:
      return "Unknown";
  }
}
