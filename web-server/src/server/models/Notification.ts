import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";

import * as z from "zod";

export type NotificationChannel = "email" | "push";

export interface INotification
  extends IMongoloquentSchema, IMongoloquentTimestamps {
  user_id: string;
  booking_id?: string;
  channel: NotificationChannel;
  message: string;
  sent_at?: Date | null;
}

export const notificationChannelEnum = z.enum(["email", "push"]);

export const notificationSchema = z.object({
  user_id: z.string().min(1, "User id is required"),
  booking_id: z.string().optional(),
  channel: notificationChannelEnum,
  message: z.string().min(1, "Message is required"),
  sent_at: z.coerce.date().nullable().optional(),
});

export default class Notification extends Model<INotification> {
  public static $schema: INotification;
  public $collection: string = "notifications";
}
