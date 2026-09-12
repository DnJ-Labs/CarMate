import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";

import Booking, {
  IBooking,
  BookingStatus,
  serviceDoneSchema,
} from "@/server/models/Booking";
import Workshop, { IWorkshop } from "@/server/models/Workshops";
import * as z from "zod";

interface ICtx {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, ctx: ICtx) {
  try {
    const { id } = await ctx.params;
    const userId = request.headers.get("x-user-id");
    const role = request.headers.get("x-user-role");

    if (!userId) {
      throw new BadRequestError("User Id is required");
    }

    let booking: IBooking | null;
    if (role === "admin") {
      booking = await Booking.where("_id", id).first();
    } else {
      booking = await Booking.where("_id", id).where("user_id", userId).first();
    }

    if (!booking) {
      throw new BadRequestError("Booking not found");
    }

    return Response.json(booking, { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}

export const dynamic = "force-dynamic";

const patchStatusEnum = z.enum([
  "checked_in",
  "onprogress",
  "done",
  "cancelled",
]);

const patchBookingSchema = z
  .object({
    status: patchStatusEnum.optional(),
    services_done: z.array(serviceDoneSchema).optional(),
    pending_tasks: z.array(z.string()).optional(),
    report_pdf_url: z.url("Invalid URL format").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  confirmed: ["checked_in", "cancelled"],
  checked_in: ["onprogress", "cancelled"],
  onprogress: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const userId = request.headers.get("x-user-id");
    const role = request.headers.get("x-user-role");

    if (!userId) throw new BadRequestError("Missing authenticated user");
    if (role !== "admin") throw new BadRequestError("Admin access required");

    const body = await request.json();
    const validated = patchBookingSchema.parse(body);

    const booking = (await Booking.find(id)) as unknown as IBooking | null;
    if (!booking) throw new BadRequestError("Booking not found");

    const workshop = (await Workshop.find(
      booking.bengkel_id,
    )) as unknown as IWorkshop | null;
    if (!workshop) throw new BadRequestError("Bengkel not found");
    if (workshop.adminId !== userId) {
      throw new BadRequestError("This booking does not belong to your bengkel");
    }

    if (validated.status) {
      const allowed = allowedTransitions[booking.status];
      if (!allowed.includes(validated.status)) {
        throw new BadRequestError(
          `Cannot change status from "${booking.status}" to "${validated.status}"`,
        );
      }
    }

    const updatePayload: Partial<IBooking> = {};

    if (validated.services_done) {
      updatePayload.services_done = validated.services_done;
      updatePayload.total_price = validated.services_done.reduce(
        (sum, s) => sum + s.price,
        0,
      );
    }
    if (validated.pending_tasks) {
      updatePayload.pending_tasks = validated.pending_tasks;
    }
    if (validated.report_pdf_url) {
      updatePayload.report_pdf_url = validated.report_pdf_url;
    }
    if (validated.status) {
      updatePayload.status = validated.status;
    }

    const finalServicesDone =
      updatePayload.services_done ?? booking.services_done ?? [];
    if (validated.status === "onprogress" && finalServicesDone.length === 0) {
      throw new BadRequestError(
        "Cannot move to onprogress without recording services_done first",
      );
    }

    await Booking.where("_id", id).update(updatePayload);

    const updatedBooking = (await Booking.find(
      id,
    )) as unknown as IBooking | null;

    return Response.json("update booking succeed", { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}
