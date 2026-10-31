import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address."],
    },
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters."],
      maxlength: [30, "Username must be at most 30 characters."],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must be at least 8 characters."],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, user) {
        delete user.password;
        delete user.__v;
        return user;
      },
    },
  },
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Requires the document to be loaded with .select("+password").
userSchema.methods.checkPassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
