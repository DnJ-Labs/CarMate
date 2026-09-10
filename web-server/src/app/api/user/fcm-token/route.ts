import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";

import User from "@/server/models/User";
import { UnauthorizedError } from "@/server/helpers/customError";
import { getUserFromRequest } from "@/server/helpers/decode";

export async function PATCH(request: Request) {
  try {
    const decoded = getUserFromRequest(request);

    const body = await request.json();
    if (!body.fcm_token) throw new BadRequestError("fcm_token is required");

    const user = await User.where("_id", decoded._id).first();
    if (!user) throw new UnauthorizedError("User not found");

    const currentTokens = user.fcm_tokens || [];

    if (!currentTokens.includes(body.fcm_token)) {
      const updatedTokens = [...currentTokens, body.fcm_token];

      await User.where("_id", decoded._id).update({
        fcm_tokens: updatedTokens,
      });
    }

    return Response.json(
      { success: true, message: "FCM token updated" },
      { status: 200 },
    );
  } catch (err: unknown) {
    const { message, status } = errorHandler(err);
    return Response.json({ message }, { status });
  }
}
