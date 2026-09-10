import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";

import * as z from "zod";

export interface IAdmin extends IMongoloquentSchema, IMongoloquentTimestamps {
  name: string;
  email: string;
  password: string;
}

export const adminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email format"),
  password: z
    .string()
    .min(5, "Password must be at least 5 characters")
    .max(8, "Password must be at most 8 characters"),
});

export default class Admin extends Model<IAdmin> {
  public static $schema: IAdmin;
  public $collection: string = "admins";
}
