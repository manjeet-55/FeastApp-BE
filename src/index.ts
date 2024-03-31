import app from "./server";
import { Request, Response } from "express";
app.listen(8000, () => {
  console.log("server listening ");
});
app.get("/", (req:Request, res:Response) => {
  res.send("Hello from server");
});
