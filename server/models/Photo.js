import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    dish: { type: mongoose.Schema.Types.ObjectId, ref: "Dish", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_document, photo) {
        delete photo.id;
        delete photo.data;
        delete photo.__v;
        return photo;
      },
    },
  },
);

photoSchema.virtual("url").get(function () {
  return `/api/photos/${this.id}`;
});

const Photo = mongoose.model("Photo", photoSchema);

export default Photo;
