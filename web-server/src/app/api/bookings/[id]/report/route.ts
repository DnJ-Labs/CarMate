import PDFDocument from "pdfkit";
import Booking, { IBooking } from "@/server/models/Booking";
import User, { IUser } from "@/server/models/User";
import Vehicle, { IVehicle } from "@/server/models/Vehicle";
import Workshop, { IWorkshop } from "@/server/models/Workshops";
import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";

interface IContext {
  params: Promise<{ id: string }>;
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function GET(request: Request, ctx: IContext) {
  try {
    const { id } = await ctx.params;

    // =========================
    // GET BOOKING
    // =========================
    const booking = (await Booking.find(id)) as unknown as IBooking | null;

    if (!booking) {
      throw new BadRequestError("Booking not found");
    }

    // =========================
    // GET USER
    // =========================
    const user = (await User.find(booking.user_id)) as unknown as IUser | null;

    if (!user) {
      throw new BadRequestError("User not found");
    }

    // =========================
    // GET VEHICLE
    // =========================
    const vehicle = (await Vehicle.find(
      booking.vehicle_id,
    )) as unknown as IVehicle | null;

    if (!vehicle) {
      throw new BadRequestError("Vehicle not found");
    }

    // =========================
    // GET WORKSHOP
    // =========================
    const workshop = (await Workshop.find(
      booking.bengkel_id,
    )) as unknown as IWorkshop | null;

    if (!workshop) {
      throw new BadRequestError("Workshop not found");
    }

    // =========================
    // CREATE PDF
    // =========================
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    // =========================
    // HEADER
    // =========================
    doc.fontSize(24).font("Helvetica-Bold").text("CarMate", {
      align: "center",
    });

    doc.fontSize(11).font("Helvetica").text("AUTOMOTIVE SERVICE PLATFORM", {
      align: "center",
    });

    doc.moveDown(0.5);

    doc.fontSize(18).font("Helvetica-Bold").text("SERVICE REPORT", {
      align: "center",
    });

    doc.moveDown();

    // garis
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    doc.moveDown();

    // =========================
    // BOOKING INFORMATION
    // =========================
    doc.fontSize(13).font("Helvetica-Bold").text("BOOKING INFORMATION");

    doc.moveDown(0.5);

    const bookingInfoY = doc.y;

    doc.roundedRect(50, bookingInfoY, 495, 95, 6).stroke();

    doc.fontSize(10).font("Helvetica");

    doc.text(`Booking Code`, 65, bookingInfoY + 15);
    doc.text(`: ${booking.booking_code}`, 165, bookingInfoY + 15);

    doc.text(`Date`, 65, bookingInfoY + 35);
    doc.text(`: ${formatDate(booking.booking_date)}`, 165, bookingInfoY + 35);

    doc.text(`Time`, 65, bookingInfoY + 55);
    doc.text(`: ${booking.booking_time_slot}`, 165, bookingInfoY + 55);

    doc.text(`Status`, 65, bookingInfoY + 75);
    doc
      .font("Helvetica-Bold")
      .text(`: ${booking.status.toUpperCase()}`, 165, bookingInfoY + 75);

    doc.y = bookingInfoY + 115;

    // =========================
    // CUSTOMER
    // =========================
    doc.fontSize(13).font("Helvetica-Bold").text("CUSTOMER");

    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");

    doc.text(`Name        : ${user.name}`);
    doc.text(`Email       : ${user.email}`);
    doc.text(`Phone       : ${user.phone}`);

    doc.moveDown();

    // =========================
    // VEHICLE
    // =========================
    doc.fontSize(13).font("Helvetica-Bold").text("VEHICLE");

    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");

    doc.text(`Brand       : ${vehicle.brand}`);
    doc.text(`Model       : ${vehicle.model}`);
    doc.text(`Plate Number: ${vehicle.plate_number}`);

    doc.moveDown();

    // =========================
    // WORKSHOP
    // =========================
    doc.fontSize(13).font("Helvetica-Bold").text("WORKSHOP");

    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");

    doc.text(`Name        : ${workshop.name}`);
    doc.text(`Address     : ${workshop.address}`);

    doc.moveDown();

    // =========================
    // SERVICES
    // =========================
    doc.fontSize(13).font("Helvetica-Bold").text("SERVICES");

    doc.moveDown(0.5);

    const tableTop = doc.y;

    // Header tabel
    doc.rect(50, tableTop, 495, 25).fillAndStroke("#eeeeee", "#cccccc");

    doc
      .fillColor("#000000")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Service", 65, tableTop + 8);

    doc.text("Price", 430, tableTop + 8, {
      width: 100,
      align: "right",
    });

    let currentY = tableTop + 25;

    doc.font("Helvetica").fontSize(10);

    if (booking.services && booking.services.length > 0) {
      booking.services.forEach((service) => {
        doc
          .moveTo(50, currentY)
          .lineTo(545, currentY)
          .strokeColor("#dddddd")
          .stroke();

        doc.fillColor("#000000").text(service.name, 65, currentY + 8);

        doc.text(formatRupiah(service.price), 400, currentY + 8, {
          width: 130,
          align: "right",
        });

        currentY += 30;
      });
    } else {
      doc.fillColor("#666666").text("No services recorded", 65, currentY + 8);

      currentY += 30;
    }

    // Bottom table line
    doc
      .moveTo(50, currentY)
      .lineTo(545, currentY)
      .strokeColor("#cccccc")
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("TOTAL", 350, currentY + 12);

    doc.text(formatRupiah(booking.total_price ?? 0), 400, currentY + 12, {
      width: 130,
      align: "right",
    });

    doc.y = currentY + 45;

    // =========================
    // PENDING TASKS
    // =========================
    doc.fontSize(13).font("Helvetica-Bold").text("PENDING TASKS");

    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");

    if (booking.pending_tasks && booking.pending_tasks.length > 0) {
      booking.pending_tasks.forEach((task) => {
        doc.text(`• ${task}`);
      });
    } else {
      doc.fillColor("#666666").text("No pending tasks");
      doc.fillColor("#000000");
    }

    doc.moveDown();

    // =========================
    // SERVICE STATUS
    // =========================
    doc.fontSize(13).font("Helvetica-Bold").text("SERVICE STATUS");

    doc.moveDown(0.5);

    const statusY = doc.y;

    doc.roundedRect(50, statusY, 495, 40, 6).stroke();

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(booking.status.toUpperCase(), 50, statusY + 13, {
        width: 495,
        align: "center",
      });

    // =========================
    // FOOTER
    // =========================
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666666")
      .text("Generated by CarMate • Automotive Service Platform", 50, 780, {
        width: 495,
        align: "center",
      });

    // Finish PDF
    doc.end();

    // =========================
    // RETURN PDF
    // =========================
    await new Promise<void>((resolve) => {
      doc.on("end", () => resolve());
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new Response(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="CarMate-${booking.booking_code}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
