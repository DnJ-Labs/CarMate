import {
  BadRequestError,
  UnauthorizedError,
} from "@/server/helpers/customError";
import { getUserFromRequest } from "@/server/helpers/decode";
import { errorHandler } from "@/server/helpers/errorHandler";

import User from "@/server/models/User";

export async function PATCH(request: Request) {
  try {
    const decoded = getUserFromRequest(request);

    const body = await request.json();
    const { latitude, longitude } = body;

    const user = await User.where("_id", decoded._id).first();
    if (!user) throw new UnauthorizedError("User not found");

    if (latitude === undefined || longitude === undefined) {
      throw new BadRequestError("latitude and longitude are required");
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestError("Invalid latitude or longitude");
    }

    await User.where("_id", decoded._id).update({
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });

    return Response.json(
      { success: true, message: "Location updated" },
      { status: 200 },
    );
  } catch (err: unknown) {
    const { message, status } = errorHandler(err);
    return Response.json({ message }, { status });
  }
}
