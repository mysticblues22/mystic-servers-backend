import {
  db,
  contactInquiries,
  invoices,
  orders,
  announcements,
  notificationReads,
  desc,
  eq,
  and,
  inArray,
  sql,
} from "@mystic/database";

export interface NotificationItemDTO {
  id: string;
  title: string;
  description: string;
  category: "Infrastructure" | "Billing" | "Support" | "Announcements";
  time: string;
  timestamp: number;
  unread: boolean;
  link?: string;
}

/**
 * Returns notifications for a specific user (admin only for now).
 * Filters out any notification whose key exists in notification_reads for this user.
 * Only genuinely unread notifications are returned.
 */
export async function getNotificationsService(userId?: string): Promise<{
  notifications: NotificationItemDTO[];
  unreadCount: number;
}> {
  const items: NotificationItemDTO[] = [];

  // 1. Contact Inquiries Events
  try {
    const recentInquiries = await db
      .select()
      .from(contactInquiries)
      .orderBy(desc(contactInquiries.createdAt))
      .limit(5);

    for (const inq of recentInquiries) {
      items.push({
        id: `inquiry-${inq.id}`,
        title: `Contact Inquiry [${inq.ticketId}]`,
        description: `${inq.name}: ${inq.subject}`,
        category: "Support",
        time: formatRelativeTime(inq.createdAt),
        timestamp: new Date(inq.createdAt).getTime(),
        unread: inq.status === "open",
        link: "/admin/content/inquiries",
      });
    }
  } catch {}

  // 2. Invoices / Payment Events
  try {
    const recentInvoices = await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(5);

    for (const inv of recentInvoices) {
      items.push({
        id: `invoice-${inv.id}`,
        title: `Invoice #${inv.id.slice(0, 8)}`,
        description: `Status: ${inv.status.toUpperCase()} — Total: ${inv.totalCents ? (inv.totalCents / 100).toFixed(2) : "0.00"} ${inv.currency}`,
        category: "Billing",
        time: formatRelativeTime(inv.createdAt),
        timestamp: new Date(inv.createdAt).getTime(),
        unread: inv.status === "unpaid",
        link: `/dashboard/invoices/${inv.id}`,
      });
    }
  } catch {}

  // 3. Orders / Provisioning Queue Events
  try {
    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    for (const ord of recentOrders) {
      items.push({
        id: `order-${ord.id}`,
        title: `Order Request #${ord.id.slice(0, 8)}`,
        description: `Order #${ord.orderNumber || ord.id.slice(0, 8)} status: ${ord.status.toUpperCase()} — Total: ${(ord.totalAmountCents / 100).toFixed(2)} ${ord.currency}`,
        category: "Infrastructure",
        time: formatRelativeTime(ord.createdAt),
        timestamp: new Date(ord.createdAt).getTime(),
        unread: ord.status === "pending",
        link: `/dashboard/orders/${ord.id}`,
      });
    }
  } catch {}

  // 4. System Announcements
  try {
    const activeAnnouncements = await db
      .select()
      .from(announcements)
      .where(eq(announcements.isEnabled, true))
      .orderBy(desc(announcements.createdAt))
      .limit(3);

    for (const ann of activeAnnouncements) {
      items.push({
        id: `announcement-${ann.id}`,
        title: ann.title,
        description: ann.message,
        category: "Announcements",
        time: formatRelativeTime(ann.createdAt),
        timestamp: new Date(ann.createdAt).getTime(),
        unread: false,
        link: ann.link || "/products/vps",
      });
    }
  } catch {}

  // Sort all notifications by timestamp descending
  items.sort((a, b) => b.timestamp - a.timestamp);

  // Filter out notifications already read by this user (if userId provided)
  if (userId && items.length > 0) {
    try {
      const keys = items.map((i) => i.id);
      const readRows = await db
        .select({ notificationKey: notificationReads.notificationKey })
        .from(notificationReads)
        .where(
          and(
            eq(notificationReads.userId, userId),
            inArray(notificationReads.notificationKey, keys),
          ),
        );
      const readSet = new Set(readRows.map((r) => r.notificationKey));

      // Remove notifications that the user has already read
      const unread = items.filter((item) => !readSet.has(item.id));
      const unreadCount = unread.filter((item) => item.unread).length;

      return {
        notifications: unread,
        unreadCount,
      };
    } catch {}
  }

  const unreadCount = items.filter((item) => item.unread).length;

  return {
    notifications: items,
    unreadCount,
  };
}

/**
 * Marks a single notification as read for a user.
 * Idempotent — safe to call multiple times.
 */
export async function markNotificationReadService(
  userId: string,
  notificationKey: string,
): Promise<void> {
  await db
    .insert(notificationReads)
    .values({ userId, notificationKey })
    .onConflictDoNothing();
}

/**
 * Marks ALL currently visible notifications as read for a user.
 * Inserts a read record for every notification key returned by getNotificationsService.
 */
export async function markAllNotificationsReadService(
  userId: string,
): Promise<void> {
  const { notifications } = await getNotificationsService();
  if (notifications.length === 0) return;

  const values = notifications.map((n) => ({
    userId,
    notificationKey: n.id,
  }));

  await db
    .insert(notificationReads)
    .values(values)
    .onConflictDoNothing();
}

function formatRelativeTime(dateInput: Date | string): string {
  const d = new Date(dateInput);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
