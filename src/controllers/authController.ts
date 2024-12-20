import { Hono } from "hono";
import { createUserSchema, loginUserSchema } from "../schema/User";
import { sendError } from "../utils/errorHandler";
import { sendResponse } from "../utils/responseHandler";

import type { JwtVariables } from "hono/jwt";
import type { AuthService } from "../services/authService";
import type { JWTPayload } from "../schema/Auth";

export const authController = (authService: AuthService) => {
  const router = new Hono<{ Variables: JwtVariables<JWTPayload> }>();

  router.post("/register", async (c) => {
    try {
      const userRegistration = await c.req.json();
      const { email, password, name } =
        createUserSchema.parse(userRegistration);
      const token = await authService.register({
        email,
        password,
        name,
      });

      return sendResponse(
        c,
        { token },
        "User registered successfully",
        201,
      );
    } catch (error) {
      return sendError(c, error);
    }
  });

  router.post("/login", async (c) => {
    try {
      const loginData = await c.req.json();
      const { email, password } = loginUserSchema.parse(loginData);
      const token = await authService.login({ email, password });

      return sendResponse(c, { token }, "Login successful");
    } catch (error) {
      return sendError(c, error);
    }
  });

  router.get("/me", async (c) => {
    try {
      const { sub: userId } = c.get("jwtPayload");
      const user = await authService.userService.getUserById(userId);
      if (!user) return c.json({ error: "User not found" }, 404);

      return sendResponse(
        c,
        { name: user.name, email: user.email },
        "User details retrieved",
      );
    } catch (error) {
      return sendError(c, error);
    }
  });

  router.post("/logout", (c) => {
    return sendResponse(c, null, "Logged out successfully");
  });

  return router;
};
