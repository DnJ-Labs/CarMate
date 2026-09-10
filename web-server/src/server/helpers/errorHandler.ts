import { ZodError } from "zod";
import { CustomError } from "./customError";

export function errorHandler(err: unknown) {
  let status = 500;
  let message = "ISE";

  if (err instanceof ZodError) {
    const issues = err.issues;
    const messages: string[] = [];

    issues.forEach((issue) => {
      const message = `${issue.message}`;
      messages.push(message);
    });

    status = 400;
    message = messages[0];
  } else if (err instanceof CustomError) {
    status = err.status;
    message = err.message;
  }

  return { status, message };
}
