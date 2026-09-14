import { errorHandler } from "@/server/helpers/errorHandler";
import { BadRequestError } from "@/server/helpers/customError";

import Payment, { IPayment } from "@/server/models/Payment";
import crypto from "crypto";

export const dynamic = "force-dynamic";

interface MidtransNotificationBody {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    const body: MidtransNotificationBody = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      throw new BadRequestError("Incomplete notification payload");
    }

    const expectedSignature = crypto
      .createHash("sha512")
      .update(
        `${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`,
      )
      .digest("hex");

    if (!safeCompare(expectedSignature, signature_key)) {
      throw new BadRequestError("Invalid signature");
    }

    const payment = await Payment.where(
      "payment_gateway_ref",
      order_id,
    ).first();

    if (!payment) {
      // order_id tidak dikenal -> tidak perlu retry, balas 200 saja
      return Response.json(
        { message: "Payment not found, ignored" },
        { status: 200 },
      );
    }

    // Validasi jumlah (keduanya sudah integer, tidak perlu desimal lagi)
    const expectedAmount = Math.round(Number(payment.amount ?? 0));
    const notifiedAmount = Math.round(Number(gross_amount));
    if (expectedAmount !== notifiedAmount) {
      throw new BadRequestError("Amount mismatch");
    }

    let newStatus: "pending" | "paid" | "failed" = "pending";

    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      if (!fraud_status || fraud_status === "accept") {
        newStatus = "paid";
      } else if (fraud_status === "challenge") {
        newStatus = "pending"; // masih ditinjau manual, jangan langsung failed
      } else {
        newStatus = "failed";
      }
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      newStatus = "failed";
    } else if (transaction_status === "pending") {
      newStatus = "pending";
    }

    // Idempotency: jangan proses ulang kalau status sudah final & sama
    if (payment.status === "paid" && newStatus === "paid") {
      return Response.json({ message: "Already processed" }, { status: 200 });
    }
    if (payment.status === "failed" && newStatus === "failed") {
      return Response.json({ message: "Already processed" }, { status: 200 });
    }

    await Payment.where("payment_gateway_ref", order_id).update({
      status: newStatus,
      ...(newStatus === "paid" && payment.status !== "paid"
        ? { paid_at: new Date() }
        : {}),
    });

    return Response.json({ message: "Notification handled" }, { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}
