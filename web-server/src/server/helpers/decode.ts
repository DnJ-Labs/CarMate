import { verifyToken } from "@/server/helpers/jwt";
import { UnauthorizedError } from "@/server/helpers/customError";

export function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token is required");
  }

  const token = authHeader.split(" ")[1];

  try {
    return verifyToken(token); // { _id, email }
  } catch (err) {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
