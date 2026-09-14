import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import Vehicle, { IVehicle, vehicleSchema } from "@/server/models/Vehicle";

interface ICtx {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, ctx: ICtx) {
  try {
    const { id } = await ctx.params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      throw new BadRequestError("userId is required");
    }

    const vehicle: IVehicle | null = await Vehicle.where("_id", id)
      .where("user_id", userId)
      .first();
    if (!vehicle) {
      throw new BadRequestError("Vehicle not found");
    }
    return Response.json(vehicle, { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}

export async function PUT(request: Request, ctx: ICtx) {
  try {
    const { id } = await ctx.params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      throw new BadRequestError("userId is required");
    }

    const body = await request.json();
    const validated = vehicleSchema.parse({
      ...body,
      user_id: userId,
    });

    const vehicle = await Vehicle.where("_id", id)
      .where("user_id", userId)
      .first();
    if (!vehicle) {
      throw new BadRequestError("Vehicle not found");
    }

    await Vehicle.where("_id", id).where("user_id", userId).update({
      brand: validated.brand,
      model: validated.model,
      vehicles_img: validated.vehicles_img,
      plate_number: validated.plate_number,
    });

    const updatedVehicle: IVehicle | null = await Vehicle.where("_id", id)
      .where("user_id", userId)
      .first();
    return Response.json(updatedVehicle, { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}

export async function DELETE(request: Request, ctx: ICtx) {
  try {
    const { id } = await ctx.params;
    const userId = request.headers.get("x-user-id");
    const deleteVehicle = await Vehicle.where("_id", id)
      .where("user_id", userId)
      .delete();
    if (!deleteVehicle) {
      throw new BadRequestError("Vehicle not found");
    }
    return Response.json(
      { message: "Success delete vehicle" },
      { status: 200 },
    );
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}
