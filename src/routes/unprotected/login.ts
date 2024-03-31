import express from "express";
// import { loginController, userController } from "../../controllers";

const router = express.Router();

router.post("/login");
router.post("/login/forgot-password");
router.post("/login/update-password/:userId/:token");

export default router;
