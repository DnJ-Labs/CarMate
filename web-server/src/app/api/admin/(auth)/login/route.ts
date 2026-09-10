import { comparePassword } from "@/server/helpers/bcrypt";
import {
  BadRequestError,
  UnauthorizedError,
} from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import { signToken } from "@/server/helpers/jwt";
import Admin from "@/server/models/Admin";

export const dynamic = "force-dynamic";

import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.email) throw new BadRequestError("email is required");
    if (!body.password) throw new BadRequestError("password is required");

    const admin = await Admin.where("email", body.email).first();
    if (!admin) throw new UnauthorizedError("Invalid email or password");

    const isPasswordValid = comparePassword(body.password, admin.password);
    if (!isPasswordValid)
      throw new UnauthorizedError("Invalid email or password");

    const payload = {
      _id: admin._id,
      email: admin.email,
    };

    const token = signToken(payload);

    const cookieStore = await cookies();

    cookieStore.set({
      name: "access_token",
      value: token,
    });

    return Response.json({ message: "Login berhasil" }, { status: 200 });
  } catch (err: unknown) {
    const { message, status } = errorHandler(err);

    return Response.json({ message }, { status });
  }
}
