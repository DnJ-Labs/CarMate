import { hashPassword } from "@/server/helpers/bcrypt";
import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import User, { userSchema } from "@/server/models/User";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = userSchema.parse(body);

    const foundEmail = await User.where("email", validated.email).first();
    if (foundEmail) throw new BadRequestError("Email already exist");

    const hashedPassword = await hashPassword(validated.password);

    const user = await User.insert({
      username: validated.username,
      name: validated.name,
      phone: validated.phone,
      email: validated.email,
      password: hashedPassword,
      fcm_tokens: [],
      location: { type: "Point", coordinates: [0, 0] },
    });

    const { password, ...safeUser } = user;

    return Response.json(safeUser, { status: 201 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
