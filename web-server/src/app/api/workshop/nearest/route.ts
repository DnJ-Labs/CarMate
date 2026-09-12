import { errorHandler } from "@/server/helpers/errorHandler";
import Workshop, { IWorkshop } from "@/server/models/Workshops";
import { DB } from "@mongoloquent/core";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const lat: number = Number(searchParams.get("lat"));
    const lng: number = Number(searchParams.get("lng"));
    const distance: number = Number(searchParams.get("distance")) || 1000;

    const workshops = await DB.collection<IWorkshop>("workshops")
      .raw([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "dist.calculated",
            maxDistance: distance,
          },
        },
      ])
      .get();

    return Response.json(workshops, {
      status: 200,
    });
  } catch (error: unknown) {
    console.log(error);
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
