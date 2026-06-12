import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import redirectsRouter from "./routes/redirects.js";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount legacy redirect handlers at root level (not under /api) so the shared
// proxy can route /privacy-policy and /terms-of-service to this server and
// return genuine HTTP 301 redirects to bots and clients.
app.use(redirectsRouter);

app.use("/api", router);

export default app;
