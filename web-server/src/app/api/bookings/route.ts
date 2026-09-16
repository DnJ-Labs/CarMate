import { errorHandler } from "@/server/helpers/errorHandler";
import { BadRequestError } from "@/server/helpers/customError";
import Booking, {
  bookingStatusEnum,
  createBookingSchema,
} from "@/server/models/Booking";
import Workshop, {
  IWorkshop,
  IOperationalHour,
} from "@/server/models/Workshops";
import Vehicle from "@/server/models/Vehicle";

export const dynamic = "force-dynamic";

function generateBookingCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BK-${datePart}-${randomPart}`;
}

function getDayName(date: Date): string {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getUTCDay()];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) throw new BadRequestError("Missing authenticated user");

    const body = await request.json();
    const validated = createBookingSchema.parse(body);

    const vehicle = await Vehicle.where("_id", validated.vehicle_id)
      .where("user_id", userId)
      .first();
    if (!vehicle) throw new BadRequestError("Vehicle not found");

    const bookingDate = new Date(validated.booking_date);
    bookingDate.setUTCHours(0, 0, 0, 0);

    const workshop = (await Workshop.find(
      validated.bengkel_id,
    )) as unknown as IWorkshop | null;
    if (!workshop) throw new BadRequestError("Bengkel not found");
    if (!workshop.is_active) {
      throw new BadRequestError("Bengkel is not accepting bookings right now");
    }

    const dayName = getDayName(bookingDate);
    const todayHours = workshop.operational_hours.find(
      (oh: IOperationalHour) => oh.day.toLowerCase() === dayName,
    );
    if (!todayHours) {
      throw new BadRequestError("Bengkel is closed on the selected day");
    }

    const slotMinutes = timeToMinutes(validated.booking_time_slot);
    const openMinutes = timeToMinutes(todayHours.open);
    const closeMinutes = timeToMinutes(todayHours.close);

    if (slotMinutes < openMinutes || slotMinutes > closeMinutes) {
      throw new BadRequestError(
        `Selected time is outside operational hours (${todayHours.open}-${todayHours.close})`,
      );
    }

    const bookingCountToday = await Booking.where(
      "bengkel_id",
      validated.bengkel_id,
    )
      .where("booking_date", bookingDate)
      .whereNotIn("status", ["cancelled"])
      .count();

    if (bookingCountToday >= workshop.max_slot_per_day) {
      throw new BadRequestError("No available slot for the selected date");
    }

    const booking = await Booking.insert({
      ...validated,
      user_id: userId,
      booking_date: bookingDate,
      booking_code: generateBookingCode(),
      status: "confirmed",
    });

    return Response.json(booking, { status: 201 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    const role = request.headers.get("x-user-role");
    if (!userId) throw new BadRequestError("User Id is required");

    const { searchParams } = new URL(request.url);
    const bookingCode = searchParams.get("booking_code");
    const status = searchParams.get("status");

    // Validasi status kalau ada di query params
    if (status && !bookingStatusEnum.options.includes(status as any)) {
      throw new BadRequestError(
        `Invalid status. Must be one of: ${bookingStatusEnum.options.join(", ")}`,
      );
    }

    if (bookingCode) {
      const query = Booking.where("booking_code", bookingCode);
      if (role !== "admin") {
        query.where("user_id", userId);
      }
      if (status) {
        query.where("status", status);
      }

      const booking = await query.first();
      if (!booking) throw new BadRequestError("Booking not found");

      return Response.json(booking, { status: 200 });
    }

    const query =
      role === "admin" ? Booking.query() : Booking.where("user_id", userId);

    if (status) {
      query.where("status", status);
    }

    const bookings = await query.get();

    return Response.json(bookings, { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);
    return Response.json({ message }, { status });
  }
}
