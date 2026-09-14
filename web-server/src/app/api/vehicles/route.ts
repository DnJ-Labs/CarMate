import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import Vehicle, { IVehicle, vehicleSchema } from "@/server/models/Vehicle";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      throw new BadRequestError("User Id is required");
    }

    const vehicles: IVehicle[] = await Vehicle.where("user_id", userId).get();
    return Response.json(vehicles, {
      status: 200,
    });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      throw new BadRequestError("User id is required");
    }
    const body = await request.json();
    const validated = vehicleSchema.parse({ ...body, user_id: userId });
    const vehicle = await Vehicle.insert({
      user_id: userId,
      vehicles_img: validated.vehicles_img,
      brand: validated.brand,
      model: validated.model,
      plate_number: validated.plate_number,
    });

    return Response.json(vehicle, { status: 201 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}
