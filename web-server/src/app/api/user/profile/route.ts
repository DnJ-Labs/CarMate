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

export async function PUT(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      throw new BadRequestError("Missing authenticated user");
    }

    const user = await User.where("_id", userId).first();

    if (!user) {
      throw new BadRequestError("User not found");
    }

    const body = await request.json();
    const { name, username, email, phone } = body;

    // Pastikan minimal ada satu field yang mau diupdate
    if (
      name === undefined &&
      username === undefined &&
      email === undefined &&
      phone === undefined
    ) {
      throw new BadRequestError("No fields to update");
    }

    // Cek username unik (kalau diubah)
    if (username !== undefined && username !== user.username) {
      const existingUsername = await User.where("username", username).first();

      if (
        existingUsername &&
        String(existingUsername._id) !== String(user._id)
      ) {
        throw new BadRequestError("Username already taken");
      }
    }

    // Cek email unik (kalau diubah)
    if (email !== undefined && email !== user.email) {
      const existingEmail = await User.where("email", email).first();

      if (existingEmail && String(existingEmail._id) !== String(user._id)) {
        throw new BadRequestError("Email already taken");
      }
    }

    const updatePayload: Record<string, unknown> = {};

    if (name !== undefined) updatePayload.name = name;
    if (username !== undefined) updatePayload.username = username;
    if (email !== undefined) updatePayload.email = email;
    if (phone !== undefined) updatePayload.phone = phone;

    await User.where("_id", userId).update(updatePayload);

    const updatedUser = await User.where("_id", userId).first();

    if (!updatedUser) {
      throw new BadRequestError("User not found after update");
    }

    return Response.json(
      {
        message: "Profile updated successfully",
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          username: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
