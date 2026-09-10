import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";

import * as z from "zod";

export interface IUser extends IMongoloquentSchema, IMongoloquentTimestamps {
  name: string;
  email: string;
  phone: string;
  password: string;
  fcm_tokens: string[];
}

export const userSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.number(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Invalid email format"),
  password: z
    .string()
    .min(5, "Password must be at least 5 characters")
    .max(8, "Password must be at most 8 characters"),
});

export default class User extends Model<IUser> {
  public static $schema: IUser;
  public $collection: string = "users";
}
