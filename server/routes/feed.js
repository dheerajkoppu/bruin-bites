import { Router } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import { requireLogin } from "../middleware/requireLogin.js";
import User from "../models/User.js";
import Rating from "../models/Rating.js";

const router = Router();

router.get("/", requireLogin, async (req, res) => {
    const me = await User.findById(req.session.userId).select("following");
    if (!me) {
        throw new HttpError(404, "User not found");
    }
    const feed = await Rating.find({ user: { $in: me.following } })
        .sort({ updatedAt: -1 })
        .limit(50)
        .select("user dish group updatedAt")
        .populate("user", "username")
        .populate("dish", "name hall");

    res.json(feed);
}
);

export default router;