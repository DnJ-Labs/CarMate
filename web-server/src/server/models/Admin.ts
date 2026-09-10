import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";

import * as z from "zod";

export interface IAdmin extends IMongoloquentSchema, IMongoloquentTimestamps {
  name: string;
  email: string;
  password_hash: string;
}

export const adminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email format"),
  password_hash: z.string().min(1, "Password is required"),
});

export default class Admin extends Model<IAdmin> {
  public static $schema: IAdmin;
  public $collection: string = "admins";
}
