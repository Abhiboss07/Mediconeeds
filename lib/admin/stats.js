// ============================================================================
// Live admin marketplace stats — every number comes from MongoDB. Server-only.
// ============================================================================
import "server-only";
import { dbConnect } from "@/lib/db/mongoose";
import { Seller } from "@/lib/db/models/Seller";
import { Product } from "@/lib/db/models/Product";
import { Order } from "@/lib/db/models/Order";
import { CatalogProduct } from "@/lib/db/models/CatalogProduct";
import { Notification } from "@/lib/db/models/Notification";
import { User } from "@/lib/db/models/User";

const notDeleted = { deleted: { $ne: true } };

export async function getAdminStats() {
  await dbConnect();
  const [
    totalSellers, pendingSellers, approvedSellers, rejectedSellers,
    totalProducts, pendingProducts, activeProducts, rejectedProducts,
    catalogCount, totalOrders, buyers, notifCount,
    revenueAgg, lowStockAgg, pendingSellerDocs, brandsAgg, catsAgg,
  ] = await Promise.all([
    Seller.countDocuments(),
    Seller.countDocuments({ approval: "pending" }),
    Seller.countDocuments({ approval: "approved" }),
    Seller.countDocuments({ approval: "rejected" }),
    Product.countDocuments(notDeleted),
    Product.countDocuments({ status: "pending", ...notDeleted }),
    Product.countDocuments({ status: "active", ...notDeleted }),
    Product.countDocuments({ status: "rejected", ...notDeleted }),
    CatalogProduct.countDocuments({ status: "active", published: true }),
    Order.countDocuments(),
    User.countDocuments({ role: "buyer" }),
    Notification.countDocuments(),
    Order.aggregate([{ $group: { _id: null, sum: { $sum: "$amount" } } }]),
    CatalogProduct.aggregate([{ $unwind: "$variants" }, { $match: { "variants.inventoryQty": { $lte: 10 } } }, { $group: { _id: "$_id" } }, { $count: "n" }]),
    Seller.find({ approval: "pending" }).select("company categories").sort({ createdAt: -1 }).limit(6).lean(),
    CatalogProduct.distinct("vendor", { status: "active" }),
    CatalogProduct.distinct("category", { status: "active" }),
  ]);

  return {
    totalSellers, pendingSellers, approvedSellers, rejectedSellers,
    totalProducts, pendingProducts, activeProducts, rejectedProducts,
    catalogCount, totalOrders, buyers, notifCount,
    revenue: revenueAgg[0]?.sum || 0,
    lowStock: lowStockAgg[0]?.n || 0,
    brands: brandsAgg.filter(Boolean).length,
    categories: catsAgg.filter(Boolean).length,
    pendingSellerDocs: pendingSellerDocs.map((s) => ({ id: String(s._id), company: s.company || "Seller", categories: s.categories || [] })),
  };
}
