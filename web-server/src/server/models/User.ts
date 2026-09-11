import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";

import * as z from "zod";

export interface IUser extends IMongoloquentSchema, IMongoloquentTimestamps {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  fcm_tokens: string[];
  location: {
    type: string;
    coordinates: [number, number];
  };
}

export const userSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z
    .string()
    .min(9, "Phone number is too short")
    .max(15, "Phone number is too long"),
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
