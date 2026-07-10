// Admin: approve or reject a pending product.
//   approve → status "active" (goes live)   reject → status "rejected"
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Product, publishProductToCatalog } from "@/lib/db/models/Product";
import { Seller } from "@/lib/db/models/Seller";
import { EmailOutbox } from "@/lib/db/models/EmailOutbox";
import { triggerEmailOutbox } from "@/lib/services/email";
import { notify } from "@/lib/services/notify";
import { runTransaction } from "@/lib/db/transaction";

const DECISIONS = { approve: "active", reject: "rejected" };

export async function POST(req, { params }) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });

  const { id } = await params;
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }

  const status = DECISIONS[body?.decision];
  if (!status) return NextResponse.json({ ok: false, error: "Unknown decision" }, { status: 400 });

  await dbConnect();
  
  try {
    const result = await runTransaction(async (session) => {
      const product = await Product.findById(id).session(session);
      if (!product) {
        return { error: "Not found", status: 404 };
      }

      const previousStatus = product.status;
      const actorId = g.user?.id || null;

      product.status = status;
      product.reviewedAt = new Date();
      if (actorId) product.reviewedBy = actorId;
      if (body.reason) product.rejectionReason = String(body.reason);
      await product.save({ session }); // Enforces optimistic concurrency checks via __v

      // Publish or unpublish explicitly based on transition
      await publishProductToCatalog(product, session, actorId);

      // Update Seller Stats if product went from inactive to active or vice-versa
      if (product.seller) {
        const isNowActive = status === "active";
        const wasActive = previousStatus === "active";
        
        let productDiff = 0;
        let inventoryDiff = 0;
        
        if (isNowActive && !wasActive) {
          productDiff = 1;
          inventoryDiff = product.price * product.stock;
        } else if (!isNowActive && wasActive) {
          productDiff = -1;
          inventoryDiff = -(product.price * product.stock);
        }
        
        if (productDiff !== 0 || inventoryDiff !== 0) {
          await Seller.updateOne(
            { _id: product.seller },
            {
              $inc: {
                "stats.totalProducts": productDiff,
                "stats.inventoryValue": inventoryDiff
              }
            },
            { session }
          );
        }
      }

      // Notify the product's seller of the decision.
      const seller = product.seller ? await Seller.findById(product.seller).select("user email").lean().session(session) : null;
      if (seller?.user) {
        const approved = body.decision === "approve";
        
        // In-app Notification (written inside transaction)
        await notify({
          userId: seller.user, type: approved ? "approval" : "rejected", link: "/seller/products",
          title: approved ? "Product approved" : "Product rejected",
          body: approved ? `"${product.name}" is now live.` : `"${product.name}" was rejected${body.reason ? `: ${body.reason}` : "."}`,
          email: null, // do not send email synchronously here
        }, session);

        // Email Outbox (written inside transaction)
        if (seller.email) {
          const title = approved ? "Product approved" : "Product rejected";
          const emailBody = approved ? `"${product.name}" is now live.` : `"${product.name}" was rejected${body.reason ? `: ${body.reason}` : "."}`;
          
          await EmailOutbox.create(
            [
              {
                to: seller.email,
                subject: title,
                body: emailBody,
                html: `<p><b>${title}</b></p><p>${emailBody}</p>`,
                status: "pending",
              },
            ],
            { session }
          );
        }
      }
      return { ok: true };
    });

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    // Trigger Outbox email sending post-commit in non-blocking background task
    triggerEmailOutbox().catch((err) => console.error("Outbox process error:", err));

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("[PUBLISH_BRIDGE] [FAILED] Admin approval transaction aborted:", err);
    return NextResponse.json({ ok: false, error: err.message || "Transaction error" }, { status: 500 });
  }
}
