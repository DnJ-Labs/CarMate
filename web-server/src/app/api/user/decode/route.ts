import { errorHandler } from "@/server/helpers/errorHandler";
import { verifyToken } from "@/server/helpers/jwt";
import { BadRequestError } from "@/server/helpers/customError";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.token) throw new BadRequestError("token is required");

    const decoded = verifyToken(body.token);

    return Response.json({ success: true, data: decoded }, { status: 200 });
  } catch (err: unknown) {
    const { message, status } = errorHandler(err);
    return Response.json({ message }, { status });
  }
}
