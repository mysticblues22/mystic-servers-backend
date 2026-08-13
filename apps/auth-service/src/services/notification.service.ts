import {
  db,
  contactInquiries,
  invoices,
  orders,
  announcements,
  desc,
  eq,
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

export async function getNotificationsService(): Promise<{
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
        time: "Active Announcement",
        timestamp: new Date(ann.createdAt).getTime(),
        unread: false,
        link: ann.link || "/products/vps",
      });
    }
  } catch {}

  // Sort all notifications by timestamp descending
  items.sort((a, b) => b.timestamp - a.timestamp);

  const unreadCount = items.filter((item) => item.unread).length;

  return {
    notifications: items,
    unreadCount,
  };
}

function formatRelativeTime(dateInput: Date | string): string {
  const d = new Date(dateInput);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
