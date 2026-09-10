import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";

import * as z from "zod";

export type BookingStatus =
  | "pending"
  | "checked_in"
  | "onprogress"
  | "done"
  | "cancelled";

export interface IServiceDone {
  name: string;
  price: number;
}

export interface IBooking extends IMongoloquentSchema, IMongoloquentTimestamps {
  booking_code: string;
  user_id: string;
  bengkel_id: string;
  vehicle_id: string;
  booking_date: Date;
  booking_time_slot: string;
  status: BookingStatus;
  services_done?: IServiceDone[];
  total_price?: number | null;
  pending_tasks?: string[];
  notes?: string;
  report_pdf_url?: string;
}

export const serviceDoneSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  price: z.number().nonnegative(),
});

export const bookingStatusEnum = z.enum([
  "pending",
  "confirmed",
  "checked_in",
  "onprogress",
  "done",
  "cancelled",
]);

export const bookingSchema = z.object({
  booking_code: z.string().min(1, "Booking code is required"),
  user_id: z.string().min(1, "User id is required"),
  bengkel_id: z.string().min(1, "Bengkel id is required"),
  vehicle_id: z.string().min(1, "Vehicle id is required"),
  booking_date: z.coerce.date(),
  booking_time_slot: z.string().min(1, "Booking time slot is required"),
  status: bookingStatusEnum.default("pending"),
  services_done: z.array(serviceDoneSchema).optional(),
  total_price: z.number().nonnegative().nullable().optional(),
  pending_tasks: z.array(z.string()).optional(),
  notes: z.string().optional(),
  report_pdf_url: z.url("Invalid URL format").optional(),
});

export default class Booking extends Model<IBooking> {
  public static $schema: IBooking;
  public $collection: string = "bookings";
}
