import { errorHandler } from "@/server/helpers/errorHandler";
import Workshop, { IWorkshop } from "@/server/models/Workshops";

interface ICtx {
  params: Promise<{ id: string }>;
}

export async function GET( request: Request, ctx: ICtx ) {
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
