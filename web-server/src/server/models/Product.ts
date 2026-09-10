import {
  Model,
  IMongoloquentSchema,
  IMongoloquentTimestamps,
} from "@mongoloquent/core";

export interface IProduct extends IMongoloquentSchema, IMongoloquentTimestamps {
  name: string;
  slug: string;
  description: string;
  excerpt: string;
  price: number;
  tags: string[];
  thumbnail: string;
  images: string[];
}

export default class Product extends Model<IProduct> {
  public static $schema: IProduct;
  public $collection: string = "products";
}
