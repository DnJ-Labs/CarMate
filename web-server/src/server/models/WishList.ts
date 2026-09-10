import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";
import { ObjectId } from "mongodb";

interface IWishList extends IMongoloquentSchema, IMongoloquentTimestamps {
  userId: ObjectId;
  productId: ObjectId;
}

export default class WishList extends Model<IWishList> {
  public static $schema: IWishList;
  public $collection: string = "wishlists";
}
