import { createServer } from "@mystic/core";

import { registerAuthRoutes } from "./routes/auth.js";
import { registerLoginRoutes } from "./routes/login.js";
import { registerLogoutRoutes } from "./routes/logout.js";
import { registerRefreshRoutes } from "./routes/refresh.js";
import { registerMeRoutes } from "./routes/me.js";
import { registerVerifyEmailRoutes } from "./routes/verify-email.js";
import { registerForgotPasswordRoute } from "./routes/forgot-password.js";
import { registerResetPasswordRoute } from "./routes/reset-password.js";

export async function buildApp() {
  const app = await createServer();

  await registerAuthRoutes(app);
  await registerLoginRoutes(app);
  await registerLogoutRoutes(app);
  await registerRefreshRoutes(app);
  await registerMeRoutes(app);
  await registerVerifyEmailRoutes(app);
  await registerForgotPasswordRoute(app);
  await registerResetPasswordRoute(app);

  return app;
}
