// ============================================================================
// Build the account-dashboard summary for a buyer. Single source of truth shared
// by the dashboard page (server component) and /api/account/summary. Every value
// is derived from the buyer's own documents — no mock/demo data.
// ============================================================================
import "server-only";
import { dbConnect } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";
import { Notification } from "@/lib/db/models/Notification";
import { CatalogProduct } from "@/lib/db/models/CatalogProduct";

export const EMPTY_SUMMARY = {
  stats: { orders: 0, wishlist: 0, addresses: 0, rewardPoints: 0 },
  profile: { name: "", email: "", avatarUrl: "" },
  recentOrders: [],
  wishlist: [],
  unreadNotifications: 0,
};

export async function buildBuyerSummary(buyer) {
  if (!buyer) return EMPTY_SUMMARY;
  await dbConnect();
  const handles = Array.isArray(buyer.wishlist) ? buyer.wishlist : [];

  const [ordersCount, recent, unread, wishlistProducts] = await Promise.all([
    Order.countDocuments({ buyer: buyer._id }),
    Order.find({ buyer: buyer._id }).sort({ placedAt: -1 }).limit(5).lean(),
    Notification.countDocuments({ user: buyer._id, read: false }),
    handles.length
      ? CatalogProduct.find({ handle: { $in: handles } }).select("handle title image priceMin").limit(8).lean()
      : Promise.resolve([]),
  ]);

  const byHandle = new Map(wishlistProducts.map((p) => [p.handle, p]));
  return {
    stats: {
      orders: ordersCount,
      wishlist: handles.length,
      addresses: Array.isArray(buyer.addresses) ? buyer.addresses.length : 0,
      rewardPoints: buyer.rewardPoints || 0,
    },
    profile: { name: buyer.name || "", email: buyer.email || "", avatarUrl: buyer.avatarUrl || "" },
    recentOrders: recent.map((o) => {
      const first = o.items?.[0];
      const more = (o.items?.length || 0) > 1 ? ` +${o.items.length - 1} more` : "";
      return {
        id: o.orderNo,
        title: (first?.name || "Order") + more,
        date: o.placedAt ? new Date(o.placedAt).toISOString().slice(0, 10) : "",
        status: o.status,
        total: o.amount || 0,
      };
    }),
    wishlist: handles
      .map((h) => byHandle.get(h))
      .filter(Boolean)
      .map((p) => ({ handle: p.handle, title: p.title, image: p.image, price: p.priceMin || 0 })),
    unreadNotifications: unread,
  };
}
