import PDFDocument from "pdfkit";
import Booking, { IBooking } from "@/server/models/Booking";
import User, { IUser } from "@/server/models/User";
import Vehicle, { IVehicle } from "@/server/models/Vehicle";
import Workshop, { IWorkshop } from "@/server/models/Workshops";
import { BadRequestError } from "@/server/helpers/customError";
import transporter from "@/server/helpers/mailer";

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

export async function generateServiceReportPdf(bookingId: string): Promise<{
  pdfBuffer: Buffer;
  booking: IBooking;
}> {
  const booking = (await Booking.find(bookingId)) as unknown as IBooking | null;
  if (!booking) throw new BadRequestError("Booking not found");

  if (booking.status !== "done") {
    throw new BadRequestError(
      "Service report can only be generated when booking is done",
    );
  }

  const user = (await User.find(booking.user_id)) as unknown as IUser | null;
  if (!user) throw new BadRequestError("User not found");

  const vehicle = (await Vehicle.find(
    booking.vehicle_id,
  )) as unknown as IVehicle | null;
  if (!vehicle) throw new BadRequestError("Vehicle not found");

  const workshop = (await Workshop.find(
    booking.bengkel_id,
  )) as unknown as IWorkshop | null;
  if (!workshop) throw new BadRequestError("Workshop not found");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  doc.fontSize(24).font("Helvetica-Bold").text("CarMate", { align: "center" });
  doc.fontSize(11).font("Helvetica").text("AUTOMOTIVE SERVICE PLATFORM", {
    align: "center",
  });
  doc.moveDown(0.5);
  doc.fontSize(18).font("Helvetica-Bold").text("SERVICE REPORT", {
    align: "center",
  });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();

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

  doc.fontSize(13).font("Helvetica-Bold").text("CUSTOMER", 65);
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");
  doc.text(`Name        : ${user.name}`, 65);
  doc.text(`Email       : ${user.email}`, 65);
  doc.text(`Phone       : ${user.phone}`, 65);
  doc.moveDown();

  doc.fontSize(13).font("Helvetica-Bold").text("VEHICLE", 65);
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");
  doc.text(`Brand       : ${vehicle.brand}`, 65);
  doc.text(`Model       : ${vehicle.model}`, 65);
  doc.text(`Plate Number: ${vehicle.plate_number}`, 65);
  doc.moveDown();

  doc.fontSize(13).font("Helvetica-Bold").text("WORKSHOP", 65);
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");
  doc.text(`Name        : ${workshop.name}`, 65);
  doc.text(`Address     : ${workshop.address}`, 65);
  doc.moveDown();

  doc.fontSize(13).font("Helvetica-Bold").text("SERVICES", 65);
  doc.moveDown(0.5);

  const tableTop = doc.y;
  doc.rect(50, tableTop, 495, 25).fillAndStroke("#eeeeee", "#cccccc");
  doc
    .fillColor("#000000")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Service", 65, tableTop + 8);
  doc.text("Price", 430, tableTop + 8, { width: 100, align: "right" });

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

  doc.fontSize(13).font("Helvetica-Bold").text("PENDING TASKS", 65);
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");

  if (booking.pending_tasks && booking.pending_tasks.length > 0) {
    booking.pending_tasks.forEach((task) => {
      doc.text(`• ${task}`, 65);
    });
  } else {
    doc.fillColor("#666666").text("No pending tasks", 65);
    doc.fillColor("#000000");
  }

  doc.moveDown();

  doc.fontSize(13).font("Helvetica-Bold").text("SERVICE STATUS", 50, doc.y, {
    width: 495,
    align: "center",
  });
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

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#666666")
    .text("Generated by CarMate • Automotive Service Platform", 50, 780, {
      width: 495,
      align: "center",
    });

  doc.end();

  await new Promise<void>((resolve) => {
    doc.on("end", () => resolve());
  });

  const pdfBuffer = Buffer.concat(chunks);

  return { pdfBuffer, booking };
}

export async function generateAndSendServiceReport(
  bookingId: string,
): Promise<Buffer> {
  const { pdfBuffer, booking } = await generateServiceReportPdf(bookingId);

  const user = (await User.find(booking.user_id)) as unknown as IUser | null;
  if (!user) throw new BadRequestError("User not found");

  const workshop = (await Workshop.find(
    booking.bengkel_id,
  )) as unknown as IWorkshop | null;
  if (!workshop) throw new BadRequestError("Workshop not found");

  await transporter.sendMail({
    from: `"CarMate" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `CarMate Service Report - ${booking.booking_code}`,
    text: `Halo ${user.name},

Service kendaraan Anda telah selesai.

Booking Code: ${booking.booking_code}
Workshop: ${workshop.name}
Status: ${booking.status}

Service report terlampir pada email ini.

Terima kasih telah menggunakan CarMate.`,
    attachments: [
      {
        filename: `CarMate-${booking.booking_code}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return pdfBuffer;
}
