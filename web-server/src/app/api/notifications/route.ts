import Notification, {
  notificationSchema,
  INotification,
} from "@/server/models/Notification";
import { BadRequestError } from "@/server/helpers/customError";
import { errorHandler } from "@/server/helpers/errorHandler";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      throw new BadRequestError("Missing authenticated user");
    }

    const notifications = await Notification.where("user_id", userId).get();

    return Response.json(notifications, { status: 200 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      throw new BadRequestError("Missing authenticated user");
    }

    const body = await request.json();

    const validated = notificationSchema.parse({
      ...body,
      user_id: userId,
    });

    const notification = await Notification.create(validated as INotification);

    return Response.json(notification, { status: 201 });
  } catch (error: unknown) {
    const { message, status } = errorHandler(error);

    return Response.json({ message }, { status });
  }
}
