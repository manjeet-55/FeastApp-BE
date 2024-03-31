import app from "./server";
import { Request, Response } from "express";
import unauthorized from "../src/routes/unprotected";
import authorized from "../src/routes/protected";
import { Auth } from "./middleware";
app.listen(8000, () => {
  console.log("server listening ");
});
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from server");
});

unauthorized(app);
app.use(Auth);
authorized(app);
