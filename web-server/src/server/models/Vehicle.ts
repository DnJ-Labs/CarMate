import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";

import * as z from "zod";

export interface IVehicle extends IMongoloquentSchema, IMongoloquentTimestamps {
  user_id: string;
  vehicles_img: string;
  brand: string;
  model: string;
  plate_number: string;
}

export const vehicleSchema = z.object({
  user_id: z.string().min(1, "User id is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  vehicles_img: z.string().url().optional().or(z.literal("")),
  plate_number: z.string().min(1, "Plate number is required"),
});

export default class Vehicle extends Model<IVehicle> {
  public static $schema: IVehicle;
  public $collection: string = "vehicles";
}
