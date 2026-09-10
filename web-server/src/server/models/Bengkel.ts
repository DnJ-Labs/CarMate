import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";

import * as z from "zod";

export interface IOperationalHour {
  day: string;
  open: string;
  close: string;
}

export interface IBengkel extends IMongoloquentSchema, IMongoloquentTimestamps {
  adminId: string;
  name: string;
  address: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  operational_hours: IOperationalHour[];
  max_slot_per_day: number;
  is_active: boolean;
}

export const operationalHourSchema = z.object({
  day: z.string().min(1, "Day is required"),
  open: z.string().min(1, "Open time is required"),
  close: z.string().min(1, "Close time is required"),
});

export const bengkelSchema = z.object({
  adminId: z.string().min(1, "Admin id is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  location_lat: z.number(),
  location_lng: z.number(),
  operational_hours: z.array(operationalHourSchema),
  max_slot_per_day: z.number().int().nonnegative(),
  is_active: z.boolean(),
});

export default class Bengkel extends Model<IBengkel> {
  public static $schema: IBengkel;
  public $collection: string = "bengkels";
}
