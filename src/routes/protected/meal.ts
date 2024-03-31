import express from "express";
import { mealController } from "../../controllers";
import { isAdmin } from "../../middleware";

const router = express.Router();

const {
  bookYourMeal,
  bookMultipleMeals,
  cancelMeal,
  getCountsOfUser,
  getAllCountOfDate,
  getLastFiveCounts,
  cancelAllMealsOfDate,
  getTodayNotCountedUsers,
  getMonthlyCounts,
  updateMealStatus,
  handleMissedCount,
  getMissedCounts,
  bookForGuest,
  cancelGuestMeal,
} = mealController;

router.post("/bookmeal/me", bookYourMeal);
router.post("/bookmeal/multiple", bookMultipleMeals);
router.patch("/bookmeal/update", updateMealStatus);
router.delete("/bookmeal/me/delete", cancelMeal);
router.get("/bookmeal/me/counts", getCountsOfUser);
router.post("/bookmeal/date/count", getAllCountOfDate);
router.get("/bookmeal/week/count", isAdmin, getLastFiveCounts);
router.get("/bookmeal/month/count", isAdmin, getMonthlyCounts);
router.get("/bookmeal/today/not_counted", isAdmin, getTodayNotCountedUsers);
router.delete("/bookmeal/cancel", isAdmin, cancelAllMealsOfDate);
router.post("/bookmeal/count-missed", handleMissedCount);
router.get("/bookmeal/missed-counts", isAdmin, getMissedCounts);
router.post("/bookmeal/guest", isAdmin, bookForGuest);
router.delete("/bookmeal/cancel/guest", isAdmin, cancelGuestMeal);

export default router;
