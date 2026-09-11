import { errorHandler } from "@/server/helpers/errorHandler";
import Workshop, { IWorkshop } from "@/server/models/Workshops";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const lat: number = Number(searchParams.get("lat"));

    const long: number = Number(searchParams.get("long"));

    const workshops = await Workshop.where("location", {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [106.781663, -6.26069],
          //   coordinates: [-6.26069, 106.781663],
        },
        $maxDistance: 2000,
      },
    }).get();

    return Response.json(workshops, {
      status: 200,
    });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
