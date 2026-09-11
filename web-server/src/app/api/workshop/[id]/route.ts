import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import Workshop, { bengkelSchema, IWorkshop } from "@/server/models/Workshops";

interface ICtx {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, ctx: ICtx) {
  try {
    const { id } = await ctx.params;

    const workshop = await Workshop.where("_id", id).first();

    return Response.json(workshop, {
      status: 200,
    });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}

export async function PUT(request: Request, ctx: ICtx) {
  try {
    const { id } = await ctx.params;
    const adminId = request.headers.get("x-user-id");
    if (!adminId) {
      throw new BadRequestError("Admin Id is required");
    }

    const body = await request.json();
    const validated = bengkelSchema.parse({
      ...body,
      adminId,
    });

    const workshop = await Workshop.where("_id", id)
      .where("adminId", adminId)
      .first();
    if (!workshop) {
      throw new BadRequestError("Workshop not found");
    }

    await Workshop.where("_id", id)
      .where("adminId", adminId)
      .update({
        name: validated.name,
        address: validated.address,
        location: {
          type: "Point",
          coordinates: [validated.location_lng, validated.location_lat],
        },
        operational_hours: validated.operational_hours,
        max_slot_per_day: validated.max_slot_per_day,
        is_active: validated.is_active,
      });

      const updatedWorkshop: IWorkshop | null = await Workshop.where("_id", id).where("adminId", adminId).first()

      return Response.json(updatedWorkshop, {status: 200})

  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}

export async function DELETE(request: Request, ctx: ICtx) {
  try {
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}
