import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError } from "./server/helpers/customError";
import { verifyToken } from "./server/helpers/jwt";
import User from "./server/models/User";
import { cookies } from "next/headers";
import Admin from "./server/models/Admin";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/api/payment/notification") {
    return NextResponse.next();
  }

  if (
    path.startsWith("/api/workshop") ||
    path.startsWith("/api/vehicles") ||
    path.startsWith("/api/bookings") ||
    path.startsWith("/api/payment") ||
    path.startsWith("/api/user/fcm-token") ||
    path.startsWith("/api/user/location")
  ) {
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

      const user = await User.where("_id", payload._id).first();
      const admin = await Admin.where("_id", payload._id).first();

      if (!user && !admin) {
        throw new UnauthorizedError("User not found");
      }

      const account = user || admin;
      if (!account) {
        throw new UnauthorizedError("User not found");
      }
      const role = admin ? "admin" : "user";

      const requestHeaders = new Headers(request.headers);

      requestHeaders.set("x-user-id", account._id.toString());
      requestHeaders.set("x-user-email", account.email);
      requestHeaders.set("x-user-role", role);

      if (
        path.startsWith("/api/workshop") &&
        ["POST", "PUT", "DELETE"].includes(request.method) &&
        role !== "admin"
      ) {
        throw new UnauthorizedError("Admin access required");
      }

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
