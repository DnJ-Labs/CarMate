import {
  BadRequestError,
  UnauthorizedError,
} from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import User from "@/server/models/User";
import Workshop, { IWorkshop } from "@/server/models/Workshops";
import { DB } from "@mongoloquent/core";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    const role = request.headers.get("x-user-role");

    if (!userId) throw new BadRequestError("Missing authenticated user");
    if (role !== "user") {
      throw new UnauthorizedError("Only user can access this endpoint");
    }

    const user = await User.where("_id", userId).first();
    if (!user) throw new UnauthorizedError("User not found");

    if (!user.location || !user.location.coordinates) {
      throw new BadRequestError("User location is not set yet");
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const lat: number = Number(user.location.coordinates[1]);
    const lng: number = Number(user.location.coordinates[0]);
    const distance: number = Number(searchParams.get("distance")) || 5000;

    const workshops = await DB.collection<IWorkshop>("workshops")
      .raw([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "dist.calculated",
            maxDistance: distance,
          },
        },
      ])
      .get();

    return Response.json(workshops, {
      status: 200,
    });
  } catch (error: unknown) {
    console.log(error);
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
