import MongoStore from "connect-mongo";
import session from "express-session";

export function createSession(store = MongoStore.create({ mongoUrl: process.env.MONGODB_URI })) {
  return session({
    secret: process.env.SESSION_SECRET,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });
}
