import express from "express";
// import { userController } from "../../controllers";
import { isAdmin } from "../../middleware";
const router = express.Router();
// const {
//   getAllUsers,
//   getUser,
//   getJoinedUsers,
//   insertUser,
//   updateUserPool,
//   deleteUser,
//   getNotJoinedUsers,
//   inviteUser,
//   checkPassword,
//   resetPassword,
// } = userController;

// router.get("/user/all", isAdmin, getAllUsers);
// router.get("/user", isAdmin, getUser);
// router.post("/user/all/joined", getJoinedUsers);
// router.post("/user/insert", isAdmin, insertUser);
// router.patch("/user/update", isAdmin, updateUserPool);
// router.delete("/user/delete", isAdmin, deleteUser);
// router.post("/user/all/invite", isAdmin, getNotJoinedUsers);
// router.post("/user/invite", isAdmin, inviteUser);
// router.post("/user/check-password", checkPassword);
// router.post("/user/reset-password", resetPassword);

export default router;
