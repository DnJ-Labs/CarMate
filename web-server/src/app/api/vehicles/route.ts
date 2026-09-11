import { errorHandler } from "@/server/helpers/errorHandler";
import Vehicle, { IVehicle, vehicleSchema } from "@/server/models/Vehicle";

export async function GET() {
  try {
    const vehicles: IVehicle[] = await Vehicle.get();
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
    const body = await request.json();
    const validated = vehicleSchema.parse(body);
    const vehicle = await Vehicle.insert({
      user_id: validated.user_id,
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
