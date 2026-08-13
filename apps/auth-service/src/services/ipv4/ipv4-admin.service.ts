import { db, ipv4Inventory, auditLogs, eq, desc } from "@mystic/database";
import { HttpError } from "../../errors/http-error.js";

function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = Number(part);
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part;
  });
}

export async function listIPv4InventoryService() {
  const inventory = await db
    .select()
    .from(ipv4Inventory)
    .orderBy(desc(ipv4Inventory.createdAt));

  return { inventory };
}

export async function addIPv4AddressService(
  adminUserId: string,
  input: {
    ipAddress: string;
    subnetPrefix?: string;
    regionCode?: string;
    monthlyPriceCents?: number;
    notes?: string;
  },
) {
  const cleanIp = input.ipAddress.trim();

  if (!isValidIPv4(cleanIp)) {
    throw new HttpError(400, "INVALID_IPV4_ADDRESS", `IP address '${cleanIp}' is not a valid IPv4 format`);
  }

  const [existing] = await db
    .select()
    .from(ipv4Inventory)
    .where(eq(ipv4Inventory.ipAddress, cleanIp))
    .limit(1);

  if (existing) {
    throw new HttpError(400, "DUPLICATE_IPV4_ADDRESS", `IPv4 address '${cleanIp}' already exists in inventory`);
  }

  const [newIp] = await db
    .insert(ipv4Inventory)
    .values({
      ipAddress: cleanIp,
      subnetPrefix: input.subnetPrefix || "/32",
      regionCode: (input.regionCode || "US").toUpperCase(),
      status: "available",
      monthlyPriceCents: input.monthlyPriceCents ?? 300,
      notes: input.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Audit Log Entry
  await db.insert(auditLogs).values({
    adminUserId,
    action: "IPV4_ADDED",
    entityType: "ipv4",
    entityId: newIp.id,
    details: JSON.stringify({ ipAddress: cleanIp, region: newIp.regionCode }),
    createdAt: new Date(),
  });

  return { ipv4: newIp };
}

export async function updateIPv4StatusService(
  ipv4Id: string,
  adminUserId: string,
  input: {
    status?: "available" | "assigned" | "reserved" | "blocked";
    notes?: string;
    assignedServerId?: string | null;
    assignedUserId?: string | null;
  },
) {
  const [existing] = await db
    .select()
    .from(ipv4Inventory)
    .where(eq(ipv4Inventory.id, ipv4Id))
    .limit(1);

  if (!existing) {
    throw new HttpError(404, "IPV4_NOT_FOUND", "IPv4 inventory record not found");
  }

  // State Machine Guard: Prevent assigned IP from being re-assigned or marked available without release
  if (input.status === "assigned" && !input.assignedServerId && !existing.assignedServerId) {
    throw new HttpError(400, "MISSING_ASSIGNMENT_TARGET", "An assigned IPv4 must reference an active server or customer assignment");
  }

  const [updated] = await db
    .update(ipv4Inventory)
    .set({
      ...(input.status ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.assignedServerId !== undefined ? { assignedServerId: input.assignedServerId } : {}),
      ...(input.assignedUserId !== undefined ? { assignedUserId: input.assignedUserId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(ipv4Inventory.id, ipv4Id))
    .returning();

  // Audit Log Entry
  await db.insert(auditLogs).values({
    adminUserId,
    action: "IPV4_STATUS_CHANGED",
    entityType: "ipv4",
    entityId: ipv4Id,
    details: JSON.stringify({ oldStatus: existing.status, newStatus: updated.status, ip: existing.ipAddress }),
    createdAt: new Date(),
  });

  return { ipv4: updated };
}
