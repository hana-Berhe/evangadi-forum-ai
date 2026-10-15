import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../utility/errors/errors.js";
import { AUTH_COOKIE_NAME } from "../utility/authCookie.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// The login token lives in an httpOnly cookie set by the backend.
const authenticateUser = (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    throw new UnauthenticatedError("Authentication invalid");
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthenticatedError("Session expired. Please log in again.");
    }
    throw new UnauthenticatedError("Authentication invalid");
  }

  req.user = {
    id: payload.id,
    firstName: payload.firstName,
    lastName: payload.lastName,
  };
  next();
};

export { authenticateUser };
