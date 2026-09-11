import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError } from "./server/helpers/customError";
import { verifyToken } from "./server/helpers/jwt";
import User from "./server/models/User";
import { cookies } from "next/headers";
import Admin from "./server/models/Admin";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/workshop") || path.startsWith("/api/vehicles")) {
    try {
      const cookieStore = await cookies();

      const authHeader = request.headers.get("Authorization");

      let token: string | undefined;

      if (authHeader) {
        const parts = authHeader.split(" ");

        if (parts[0] !== "Bearer") {
          throw new UnauthorizedError("Invalid authorization format");
        }

        token = parts[1];
      } else {
        token = cookieStore.get("access_token")?.value;
      }

      if (!token) {
        throw new UnauthorizedError("Token is required");
      }

      const payload = verifyToken(token);

      const user =
        (await User.where("_id", payload._id).first()) ||
        (await Admin.where("_id", payload._id).first());

      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      const requestHeaders = new Headers(request.headers);

      requestHeaders.set("x-user-id", user._id.toString());
      requestHeaders.set("x-user-email", user.email);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return NextResponse.json(
          {
            message: error.message,
          },
          {
            status: error.status,
          },
        );
      }

      console.error("PROXY ERROR:", error);

      return NextResponse.json(
        {
          message: "Internal Server Error",
        },
        {
          status: 500,
        },
      );
    }
  }

  return NextResponse.next();
}
