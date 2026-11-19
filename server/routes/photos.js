import { Router } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { HttpError } from "../middleware/errorHandler.js";
import { requireLogin } from "../middleware/requireLogin.js";
import Dish from "../models/Dish.js";
import Photo from "../models/Photo.js";

const router = Router();

const MAX_BYTES = 5 * 1024 * 1024 - 1;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } });

function readPhotoFile(request, response, next) {
  upload.single("photo")(request, response, (error) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE" ? "Photo must be under 5 MB." : "Send one file in the photo field.";
      return next(new HttpError(400, message));
    }
    next(error);
  });
}

// Checks the file's first bytes rather than trusting the client's content type.
function imageType(buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  return null;
}

router.post("/dishes/:dishId/photos", requireLogin, readPhotoFile, async (request, response) => {
  const { dishId } = request.params;
  const dish = mongoose.isValidObjectId(dishId) && (await Dish.findById(dishId));
  if (!dish) {
    throw new HttpError(404, "Dish not found.");
  }

  if (!request.file) {
    throw new HttpError(400, "Attach a photo.");
  }
  const contentType = imageType(request.file.buffer);
  if (!contentType) {
    throw new HttpError(400, "Photo must be a JPG or PNG.");
  }

  const photo = await Photo.create({ dish: dish.id, user: request.session.userId, contentType, data: request.file.buffer });
  response.status(201).json({ photo });
});

router.get("/photos/:photoId", async (request, response) => {
  const { photoId } = request.params;
  const photo = mongoose.isValidObjectId(photoId) && (await Photo.findById(photoId).select("+data"));
  if (!photo) {
    throw new HttpError(404, "Photo not found.");
  }
  response.set("Cache-Control", "public, max-age=31536000, immutable");
  response.type(photo.contentType).send(photo.data);
});

export default router;
