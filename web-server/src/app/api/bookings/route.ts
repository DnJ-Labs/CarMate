import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import Booking, { bookingSchema } from "@/server/models/Booking";
import Vehicle from "@/server/models/Vehicle";
import Workshop from "@/server/models/Workshops";


export async function POST(request: Request) {
    try {
        const userId = request.headers.get("x-user-id")
        if(!userId){
            throw new BadRequestError("User id is required")
        }

        const body = await request.json()
        const vehicle = await Vehicle.where("_id", body.vehicle_id).where("user_id", userId).first()

        if(!vehicle){
            throw new BadRequestError("Vehicle not found")
        }

        const workshop = await Workshop.where("_id", body.bengkel_id).where("is_active", true).first()

        if(!workshop){
            throw new BadRequestError("Workshop not found")
        }

        const bookingCode = `CM-${Date.now()}`
        const validated = bookingSchema.parse({
            ...body,
            booking_code: bookingCode,
            user_id: userId,
            status: "pending"
        })      
        
        const booking = await Booking.insert({
            booking_code: validated.booking_code,
            user_id: validated.user_id,
            bengkel_id: validated.bengkel_id,
            vehicle_id: validated.vehicle_id,
            booking_date: validated.booking_date,
            booking_time_slot: validated.booking_time_slot,
            status: validated.status,
            services_done: validated.services_done,
            total_price: validated.total_price,
            pending_tasks: validated.pending_tasks,
            notes: validated.notes,
            report_pdf_url: validated.report_pdf_url
        })

        return Response.json(booking, {status: 201})
    } catch (error: unknown) {
        const { message, status } = errorHandler(error);
    
        return Response.json({ message }, { status });
    }
}

export async function GET(request: Request) {
    try {
        const userId = request.headers.get("x-user-id")
        if(!userId){
            throw new BadRequestError("User Id is required")
        }

        const bookings = await Booking.where("user_id", userId).get()
        
        return Response.json(bookings, {status: 200})
    } catch (error: unknown) {
        const { message, status } = errorHandler(error);
    
        return Response.json({ message }, { status });
    }
}