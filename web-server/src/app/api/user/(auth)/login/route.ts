import { comparePassword } from "@/server/helpers/bcrypt";
import {
  BadRequestError,
  UnauthorizedError,
} from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import { signToken } from "@/server/helpers/jwt";
import User from "@/server/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.email) throw new BadRequestError("email is required");
    if (!body.password) throw new BadRequestError("password is required");

    const user = await User.where("email", body.email).first();
    if (!user) throw new UnauthorizedError("Invalid email or password");

    const isPasswordValid = comparePassword(body.password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedError("Invalid email or password");

    const payload = {
      _id: user._id,
      email: user.email,
    };

    const token = signToken(payload);

    return Response.json(
      {
        success: true,
        message: "Login successful",
        data: { token },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const { message, status } = errorHandler(err);
    return Response.json({ message }, { status });
  }
}
