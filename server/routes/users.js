import { Router } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import { requireLogin } from "../middleware/requireLogin.js";
import User from "../models/User.js";

const router = Router();

router.post("/:username/follow", requireLogin, async (req, res) => {
    const { username } = req.params;
    const userId = req.session.userId;

    const userToFollow = await User.findOne({ username });

    if (!userToFollow) {
        throw new HttpError(404, "User not found");
    }

    if (userToFollow._id.equals(userId)) {
        throw new HttpError(400, "You cannot follow yourself");
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { following: userToFollow._id } });

    res.status(200).json({ message: `You are now following ${username}` });
}
);

router.delete("/:username/follow", requireLogin, async (req, res) => {
    const { username } = req.params;
    const userId = req.session.userId;

    const userToUnfollow = await User.findOne({ username });

    if (!userToUnfollow) {
        throw new HttpError(404, "User not found");
    }

    if (userToUnfollow._id.equals(userId)) {
        throw new HttpError(400, "You cannot unfollow yourself");
    }

    await User.findByIdAndUpdate(userId, { $pull: { following: userToUnfollow._id } });

    res.status(200).json({ message: `You have unfollowed ${username}` });
}
);

export default router;