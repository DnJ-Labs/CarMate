import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";

import Payment, { IPayment } from "@/server/models/Payment";
import * as z from "zod";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const userId = request.headers.get("x-user-id");
    const role = request.headers.get("x-user-role");

    if (!userId) throw new BadRequestError("User Id is required");

    let payment: IPayment | null;
    if (role === "admin") {
      payment = (await Payment.find(id)) as unknown as IPayment | null;
    } else {
      payment = (await Payment.where("_id", id)
        .where("userId", userId)
        .first()) as unknown as IPayment | null;
    }

    if (!payment) throw new BadRequestError("Payment not found");

    const cleanPayment = (payment as any).$original ?? payment;
    return Response.json(cleanPayment, { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}

const patchPaymentSchema = z.object({
  status: z.enum(["paid", "failed"]),
});

// khusus admin, konfirmasi manual payment CASH
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const role = request.headers.get("x-user-role");

    if (role !== "admin") throw new BadRequestError("Admin access required");

    const body = await request.json();
    const validated = patchPaymentSchema.parse(body);

    const payment = (await Payment.find(id)) as unknown as IPayment | null;
    if (!payment) throw new BadRequestError("Payment not found");

    if (payment.payment_method !== "cash") {
      throw new BadRequestError("Only cash payments can be confirmed manually");
    }
    if (payment.status !== "pending") {
      throw new BadRequestError(
        `Cannot update payment with current status "${payment.status}"`,
      );
    }

    await Payment.where("_id", id).update({
      status: validated.status,
      ...(validated.status === "paid" ? { paid_at: new Date() } : {}),
    });

    const updatedPayment = (await Payment.find(
      id,
    )) as unknown as IPayment | null;
    if (!updatedPayment) throw new BadRequestError("Payment not found");

    const data = (updatedPayment as any).$original ?? updatedPayment;

    return Response.json(
      {
        _id: data._id,
        userId: data.userId,
        booking_id: data.booking_id,
        amount: data.amount,
        payment_method: data.payment_method,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        paid_at: data.paid_at,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}
