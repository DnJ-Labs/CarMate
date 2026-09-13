import { errorHandler } from "@/server/helpers/errorHandler";
import { generateServiceReportPdf } from "@/server/helpers/reportService";

interface IContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, ctx: IContext) {
  try {
    const { id } = await ctx.params;

    const { pdfBuffer, booking } = await generateServiceReportPdf(id);

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
