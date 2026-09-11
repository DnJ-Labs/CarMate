import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import Workshop, { bengkelSchema, IWorkshop } from "@/server/models/Workshops";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
}

interface WorkshopResponse {
  data: IWorkshop[];
  pagination: Pagination;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const page: number = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit: number = 2;
    const skip: number = (page - 1) * limit;
    const workshops: IWorkshop[] = await Workshop.get();
    const total: number = workshops.length;
    const totalPages: number = Math.ceil(total / limit);
    const data: IWorkshop[] = workshops.slice(skip, skip + limit);
    const response: WorkshopResponse = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        first: 1,
        prev: page > 1 ? page - 1 : null,
        next: page < totalPages ? page + 1 : null,
        last: totalPages,
      },
    };

    return Response.json(response, {
      status: 200,
    });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adminId = request.headers.get("x-user-id")
    if(!adminId){
      throw new BadRequestError("Admin id is required")
    }

    const validated = bengkelSchema.parse({...body, adminId});

    const workshop = await Workshop.insert({
      adminId: adminId,
      name: validated.name,
      address: validated.address,
      location: {
        type: "Point",
        coordinates: [validated.location_lng, validated.location_lat],
      },
      operational_hours: validated.operational_hours,
      max_slot_per_day: validated.max_slot_per_day,
      is_active: validated.is_active,
    });

    return Response.json(workshop, {
      status: 201,
    });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
