import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";

import Payment, { IPayment } from "@/server/models/Payment";
import Booking, { IBooking } from "@/server/models/Booking";
import * as z from "zod";
import { snap } from "@/server/helpers/midtrans";

export const dynamic = "force-dynamic";

const createPaymentSchema = z.object({
  payment_method: z.enum(["cash", "midtrans"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: bookingId } = await params;

    const userId = request.headers.get("x-user-id");
    if (!userId) throw new BadRequestError("Missing authenticated user");

    const body = await request.json();
    const validated = createPaymentSchema.parse(body);

    const booking = (await Booking.find(
      bookingId,
    )) as unknown as IBooking | null;

    if (!booking) throw new BadRequestError("Booking not found");
    if (booking.user_id !== userId) {
      throw new BadRequestError("This booking does not belong to you");
    }
    if (booking.status !== "done") {
      throw new BadRequestError(
        "Payment can only be created after the booking is done",
      );
    }
    if (!booking.total_price || booking.total_price <= 0) {
      throw new BadRequestError("Booking has no total price to pay");
    }

    const existingPayment = (await Payment.where(
      "booking_id",
      bookingId,
    ).first()) as unknown as IPayment | null;

    if (existingPayment && existingPayment.status !== "failed") {
      throw new BadRequestError(
        `Payment for this booking already exists with status "${existingPayment.status}"`,
      );
    }

    const amount = booking.total_price;

    // CASH
    if (validated.payment_method === "cash") {
      const payment = await Payment.create({
        userId,
        booking_id: bookingId,
        amount,
        payment_method: "cash",
        status: "pending",
      });

      return Response.json(
        {
          message: "Cash payment created, waiting for admin confirmation",
          payment,
        },
        { status: 201 },
      );
    }

    // MIDTRANS
    const payment = await Payment.create({
      userId,
      booking_id: bookingId,
      amount,
      payment_method: "midtrans",
      status: "pending",
    });

    const orderId = `PAY-${payment._id}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        user_id: userId,
      },
      item_details: [
        {
          id: booking._id?.toString(),
          price: amount,
          quantity: 1,
          name: `Booking ${booking.booking_code}`,
        },
      ],
    };

    const transaction = await snap.createTransaction(parameter);

    await Payment.where("_id", payment._id).update({
      payment_gateway_ref: orderId,
    });

    return Response.json(
      {
        message: "Midtrans payment created",
        payment: {
          ...payment,
          payment_gateway_ref: orderId,
        },
        redirect_url: transaction.redirect_url,
        token: transaction.token,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}
