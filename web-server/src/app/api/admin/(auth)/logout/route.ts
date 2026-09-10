import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");

  return Response.json({ message: "Logout berhasil" }, { status: 200 });
}
