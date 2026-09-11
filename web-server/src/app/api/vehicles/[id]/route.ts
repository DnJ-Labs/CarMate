import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import Vehicle, { IVehicle } from "@/server/models/Vehicle";

interface ICtx {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, ctx: ICtx) {
  try {
    const { id } = await ctx.params;
    const vehicle: IVehicle | null = await Vehicle.where("_id", id).first();
    if (!vehicle) {
      throw new BadRequestError("Vehicle not found");
    }
    return Response.json(vehicle, { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}

export async function PUT(request: Request) {}

export async function DELETE(request: Request, ctx: ICtx) {
    try {
        
        
    } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
        
    }
}
