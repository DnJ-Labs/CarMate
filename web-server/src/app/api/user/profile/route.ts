import User from "@/server/models/User";
import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      throw new BadRequestError("Missing authenticated user");
    }

    const user = await User.where("_id", userId).first();

    if (!user) {
      throw new BadRequestError("User not found");
    }

    return Response.json(
      {
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
