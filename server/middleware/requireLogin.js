import { HttpError } from "./errorHandler.js";

export function requireLogin(request, _response, next) {
  if (!request.session.userId) {
    throw new HttpError(401, "Not logged in.");
  }
  next();
}
