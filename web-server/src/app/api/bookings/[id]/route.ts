import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";

import Booking, {
  IBooking,
  BookingStatus,
  serviceDoneSchema,
} from "@/server/models/Booking";
import Workshop, { IWorkshop } from "@/server/models/Workshops";
import * as z from "zod";

export const dynamic = "force-dynamic";

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

const patchStatusEnum = z.enum([
  "checked_in",
  "onprogress",
  "done",
  "cancelled",
]);

const patchBookingSchema = z
  .object({
    status: patchStatusEnum.optional(),
    services: z.array(serviceDoneSchema).optional(),
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

      if (validated.status === "onprogress") {
        // hanya boleh kirim status + services
        const allowedKeys = new Set(["status", "services"]);
        const sentKeys = Object.keys(validated);
        const hasDisallowedField = sentKeys.some((k) => !allowedKeys.has(k));

        if (hasDisallowedField) {
          throw new BadRequestError(
            'Saat mengubah status ke "onprogress", hanya boleh mengirim "status" dan "services" (tidak boleh ada "pending_tasks" atau "report_pdf_url")',
          );
        }

        if (!validated.services || validated.services.length === 0) {
          throw new BadRequestError(
            "services wajib diisi saat mengubah status ke onprogress",
          );
        }
      }

      // status "done": bebas kirim services (akan digabung dengan yang lama),
      // pending_tasks, dan report_pdf_url — semua opsional
    }

    const updatePayload: Partial<IBooking> = {};

    if (validated.services) {
      if (validated.status === "done") {
        // gabung dengan services yang sudah ada di booking
        updatePayload.services = [
          ...(booking.services ?? []),
          ...validated.services,
        ];
      } else {
        // onprogress (atau update tanpa perubahan status): replace langsung
        updatePayload.services = validated.services;
      }

      updatePayload.total_price = updatePayload.services.reduce(
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

    await Booking.where("_id", id).update(updatePayload);

    const updatedBooking = (await Booking.find(
      id,
    )) as unknown as IBooking | null;

    return Response.json(updatedBooking, { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}
