import { hashPassword } from "@/server/helpers/bcrypt";
import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import Admin, { adminSchema } from "@/server/models/Admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    adminSchema.parse(body);

    const foundEmail = await Admin.where("email", body.email).first();
    if (foundEmail) throw new BadRequestError("Email already exist");

    body.password = await hashPassword(body.password);

    const user = await Admin.insert(body);
    return Response.json(user, { status: 201 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
