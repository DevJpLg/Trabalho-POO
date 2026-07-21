import express from "express";
import { router } from "./shared/routes";
import { errorHandler } from "./shared/middleware/errorHandler";

const app = express();

app.use(express.json());
app.use("/api", router);
app.use(errorHandler);

export { app };
