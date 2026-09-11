import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";
import Booking, { IBooking } from "@/server/models/Booking";

interface ICtx {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, ctx: ICtx) {
    try {
        const {id} = await ctx.params
        const userId = request.headers.get("x-user-id")
        const role = request.headers.get("x-user-role")

        if(!userId){
            throw new BadRequestError("User Id is required")
        }

        let booking: IBooking | null
        if(role === "admin"){
            booking = await Booking.where("_id", id).first()
        } else {
            booking = await Booking.where("_id", id).where("user_id", userId).first()
        }

        if(!booking){
            throw new BadRequestError("Booking not found")
        }

        return Response.json(booking, {status: 200})
    } catch (error: unknown) {
        const { message, status } = errorHandler(error);
        return Response.json({ message }, { status });
        
    }
}