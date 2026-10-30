export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Turns thrown errors into { error } responses. Register last.
export function errorHandler(error, _request, response, _next) {
  if (error instanceof HttpError) {
    return response.status(error.status).json({ error: error.message });
  }

  if (error.name === "ValidationError") {
    const [first] = Object.values(error.errors);
    const message = first.name === "CastError" ? `Enter a valid ${first.path}.` : first.message;
    return response.status(400).json({ error: message });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return response.status(409).json({ error: `That ${field} is already taken.` });
  }

  console.error(error);
  response.status(500).json({ error: "Something went wrong. Please try again." });
}
