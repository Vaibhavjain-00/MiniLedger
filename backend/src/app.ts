import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes";
import loanRoutes from "./modules/loans/loans.routes";
import summaryRoutes from "./modules/summary/summary.routes";
import { HttpError } from "./utils/httpError";
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "MiniLedger API is running" }),
);
app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/summary", summaryRoutes);
app.use((_req, _res, next) => next(new HttpError(404, "Route not found")));
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof HttpError)
      return res
        .status(err.statusCode)
        .json({ success: false, error: err.message });
    console.error(err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  },
);
export default app;
