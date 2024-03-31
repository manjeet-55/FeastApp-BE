import express from "express";
import { loginController, userController } from "../../controllers";

const router = express.Router();
const { forgotPassword, updatePassword } = userController;
router.post("/login", loginController);
router.post("/login/forgot-password", forgotPassword);
router.post("/login/update-password/:userId/:token", updatePassword);

export default router;
