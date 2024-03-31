import express, { Express } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";

const app: Express = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  cors({
    origin: "*",
  }),
);
app.use(morgan("tiny"));
app.use(bodyParser.urlencoded({ extended: true }));

export default app;