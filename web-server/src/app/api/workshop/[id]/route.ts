import { errorHandler } from "@/server/helpers/errorHandler";
import Workshop, { IWorkshop } from "@/server/models/Workshops";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const workshop = await Workshop.where("_id", id).first();

    return Response.json(workshop, {
      status: 200,
    });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
