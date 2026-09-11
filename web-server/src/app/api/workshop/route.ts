import { errorHandler } from "@/server/helpers/errorHandler";
import Workshop, { IWorkshop } from "@/server/models/Workshops";

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

    const limit: number = Math.max(Number(searchParams.get("limit")) || 10, 1);

    // const skip: number = (page - 1) * limit;

    // const workshops: IWorkshop[] = await Workshop.get();

    // const total: number = workshops.length;

    // const totalPages: number = Math.ceil(total / limit);

    // const data: IWorkshop[] = workshops.slice(skip, skip + limit);

    // const response: WorkshopResponse = {
    //   data,
    //   pagination: {
    //     page,
    //     limit,
    //     total,
    //     totalPages,
    //     first: 1,
    //     prev: page > 1 ? page - 1 : null,
    //     next: page < totalPages ? page + 1 : null,
    //     last: totalPages,
    //   },
    // };
    const workshops = await Workshop.paginate(page, limit);

    return Response.json(workshops, {
      status: 200,
    });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
