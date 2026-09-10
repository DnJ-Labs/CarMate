import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";

import * as z from "zod";

export type PaymentStatus = "pending" | "paid" | "failed";

export interface IPayment extends IMongoloquentSchema, IMongoloquentTimestamps {
  userId: string;
  booking_id: string;
  amount: number;
  payment_method: string;
  payment_gateway_ref?: string;
  status: PaymentStatus;
  paid_at?: Date | null;
}

export const paymentStatusEnum = z.enum(["pending", "paid", "failed"]);

export const paymentSchema = z.object({
  userId: z.string().min(1, "User id is required"),
  booking_id: z.string().min(1, "Booking id is required"),
  amount: z.number().nonnegative(),
  payment_method: z.string().min(1, "Payment method is required"),
  payment_gateway_ref: z.string().optional(),
  status: paymentStatusEnum.default("pending"),
  paid_at: z.coerce.date().nullable().optional(),
});

export default class Payment extends Model<IPayment> {
  public static $schema: IPayment;
  public $collection: string = "payments";
}
