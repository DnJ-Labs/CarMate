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

export async function POST(request: Request) {
  try {
    const body: MidtransNotificationBody = await request.json();
    const { order_id, status_code, gross_amount, signature_key } = body;

    const expectedSignature = crypto
      .createHash("sha512")
      .update(
        `${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`,
      )
      .digest("hex");

    if (expectedSignature !== signature_key) {
      throw new BadRequestError("Invalid signature");
    }

    const payment = (await Payment.where(
      "payment_gateway_ref",
      order_id,
    ).first()) as unknown as IPayment | null;

    if (!payment) throw new BadRequestError("Payment not found");

    const { transaction_status, fraud_status } = body;

    let newStatus: "pending" | "paid" | "failed" = "pending";

    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      newStatus =
        fraud_status === "accept" || !fraud_status ? "paid" : "failed";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      newStatus = "failed";
    } else if (transaction_status === "pending") {
      newStatus = "pending";
    }

    await Payment.where("payment_gateway_ref", order_id).update({
      status: newStatus,
      ...(newStatus === "paid" ? { paid_at: new Date() } : {}),
    });

    return Response.json({ message: "Notification handled" }, { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}
