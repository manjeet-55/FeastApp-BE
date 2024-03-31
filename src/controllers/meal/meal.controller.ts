import { sendResponse, sendErrorResponse, messageResponse, globalCatch } from "../../utils";
import {
  guestModel,
  mealModel,
  monthlyMealModel,
  missedCount,
  userModel,
  userPoolModel,
} from "../../models";
import { AuthorizedRequest, HttpStatusCode } from "../../utils/types";
import { Request, Response } from "express";

const mealBookFucntion = async (email: string, date: string, bookedBy: string) => {
  try {
    let meal = await mealModel.findOne({ email: email });
    const bookedByUser = await userModel.findOne({ email: bookedBy });
    if (!meal) {
      meal = new mealModel({
        email,
        bookedDates: [
          {
            date: date,
            bookedBy: `${bookedByUser.firstName} ${bookedByUser.lastName}`,
            bookedByEmail: bookedBy,
          },
        ],
      });
      await meal.save();
    } else {
      if (meal.bookedDates.some((ele) => ele.date === date)) {
        return { message: messageResponse.MEAL_ALREADY_BOOKED };
      }
      const currentMonth = new Date(date).getMonth() + 1;
      const firstDateMonth = new Date(meal.bookedDates[0]?.date).getMonth() + 1;
      meal.bookedDates.push({
        date: date,
        mealTaken: false,
        bookedBy: `${bookedByUser.firstName} ${bookedByUser.lastName}`,
        bookedByEmail: bookedBy,
      });
      await meal.save();
      if (currentMonth - firstDateMonth >= 2 || currentMonth - firstDateMonth == -10) {
        const datesToBeDeleted = meal.bookedDates.filter((element) => {
          const currDate = new Date(element.date);
          const currMonth = currDate.getMonth() + 1;
          return currMonth == firstDateMonth;
        });
        await mealModel.findOneAndUpdate(
          { email: email },
          {
            $pull: {
              bookedDates: {
                $in: datesToBeDeleted,
              },
            },
          },
          {
            new: true,
            upsert: true,
          },
        );
      }
    }
  } catch (error) {
    throw error;
  }
};

const bookYourMeal = async (request: Request, response: Response) => {
  try {
    const { email, date, bookedBy } = request.body;
    if (!email || !date || !bookedBy) {
      return sendErrorResponse(HttpStatusCode.BAD_REQUEST, messageResponse.BAD_REQUEST, response);
    }
    const meal = await mealBookFucntion(email, date, bookedBy);
    if (meal?.message === messageResponse.MEAL_ALREADY_BOOKED) {
      return sendErrorResponse(
        HttpStatusCode.CONFLICT,
        messageResponse.MEAL_ALREADY_BOOKED,
        response,
      );
    }
    return sendResponse(HttpStatusCode.CREATED, messageResponse.MEAL_BOOKED, meal, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const bookMultipleMeals = async (request: Request, response: Response) => {
  try {
    const { email, dates, bookedBy } = request.body;
    const bookedByUser = await userModel.findOne({ email: bookedBy });
    const data = dates.map((date) => {
      return {
        date: date,
        mealTaken: false,
        bookedBy: `${bookedByUser.firstName} ${bookedByUser.lastName}`,
        bookedByEmail: bookedBy,
      };
    });
    let mealResult = await mealModel.findOne({ email: email });
    if (!mealResult) {
      mealResult = await mealModel.create({
        email: email,
        bookedDates: data,
      });
    } else {
      const existingDates = mealResult.bookedDates.map((booking) => booking.date);
      const duplicateDates = data.filter((item) => existingDates.includes(item.date));
      if (duplicateDates.length > 0) {
        return sendErrorResponse(
          HttpStatusCode.CONFLICT,
          `${messageResponse.MEAL_ALREADY_BOOKED} for dates ${duplicateDates.map(
            (item) => item.date,
          )}`,
          response,
        );
      }
      await Promise.all(
        dates.map(async (date) => {
          await mealBookFucntion(email, date, bookedBy);
        }),
      );
    }
    const result = await mealModel.findOne({
      email,
    });
    return sendResponse(HttpStatusCode.CREATED, messageResponse.MEAL_BOOKED, result, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const cancelMeal = async (request: Request, response: Response) => {
  try {
    const { email, date } = request.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return sendErrorResponse(HttpStatusCode.BAD_REQUEST, messageResponse.INVALID_USER, response);
    }
    const mealFound = await mealModel.findOne({ email: user.email });
    if (!mealFound) {
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.MEAL_NOT_BOOKED, response);
    }
    if (mealFound.bookedDates.some((ele) => ele.date === date)) {
      const index = mealFound.bookedDates.findIndex((item) => item.date === date);
      mealFound.bookedDates.splice(index, 1);
      await mealFound.save();
      return sendResponse(HttpStatusCode.OK, messageResponse.COUNT_CANCELLED, mealFound, response);
    }
    return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.MEAL_NOT_BOOKED, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const updateMealStatus = async (request: Request, response: Response) => {
  try {
    const { email, date } = request.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return sendErrorResponse(HttpStatusCode.BAD_REQUEST, messageResponse.INVALID_USER, response);
    }
    const updatedMeal = await mealModel.findOneAndUpdate(
      {
        email: email,
        "bookedDates.date": date,
      },
      {
        $set: {
          "bookedDates.$.mealTaken": true,
        },
      },
      { new: true },
    );
    if (!updatedMeal) {
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.MEAL_NOT_BOOKED, response);
    }
    return sendResponse(HttpStatusCode.OK, messageResponse.MEAL_UPDATED, updatedMeal, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const getCountsOfUser = async (request: Request, response: Response) => {
  try {
    const { email } = request.query;
    const user = await userModel.findOne({ email: email as string });
    if (!user) {
      return sendErrorResponse(HttpStatusCode.BAD_REQUEST, messageResponse.INVALID_USER, response);
    }
    const mealFound = await mealModel.findOne({ email: user.email });
    if (!mealFound) {
      return sendResponse(HttpStatusCode.OK, messageResponse.BOOK_YOUR_FIRST_MEAL, [], response);
    }
    return sendResponse(
      HttpStatusCode.OK,
      messageResponse.DATE_FETCHED_SUCCESS,
      mealFound?.bookedDates?.filter((item) => item.bookedBy),
      response,
    );
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const getAllCountOfDate = async (request: Request, response: Response) => {
  try {
    const { date } = request.body;
    const { location } = request.query;
    const foundUsers = await mealModel.find({
      bookedDates: { $elemMatch: { date: date } },
    });
    let users;
    if (foundUsers) {
      users = foundUsers.map(async (element) => {
        const foundUser = await userPoolModel.findOne({ email: element.email });
        if (foundUser) {
          return {
            id: foundUser._id,
            fullName: foundUser.fullName,
            email: element.email,
            location: foundUser.location,
          };
        }
      });
    }
    const foundGuests = await guestModel.find({
      bookedDates: { $elemMatch: { date: date } },
    });
    let guests = [];
    if (foundGuests.length > 0) {
      guests = foundGuests.map(async (element) => {
        if (element.email === messageResponse.GUEST_EMAIL) {
          return {
            id: element?._id,
            fullName: messageResponse.GUEST_EMAIL,
            email: messageResponse.GUEST_EMAIL,
            location: element?.location,
          };
        } else {
          const foundUser = await userPoolModel.findOne({
            email: element.email,
          });
          return {
            id: element._id,
            fullName: foundUser.fullName,
            email: element.email,
            location: element.location,
          };
        }
      });
    }
    const res1 = users.length > 0 ? await Promise.all(users) : [];
    const res2 = guests.length > 0 ? await Promise.all(guests) : [];
    const result = res1.concat(res2);
    const count =
      result.length > 0 ? result.filter((user) => user && user.location === `${location}`) : [];
    return sendResponse(HttpStatusCode.OK, messageResponse.DATE_FETCHED_SUCCESS, count, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const getLastFiveCounts = async (request: Request, response: Response) => {
  try {
    const { location } = request.query;
    const lastFiveDay = [];
    const currentDate = new Date();
    for (let i = 1; lastFiveDay.length < 5; i++) {
      const day = new Date(currentDate);
      day.setDate(day.getDate() - i);
      if (day.getDay() !== 6 && day.getDay() !== 0) {
        lastFiveDay.push(day.toISOString().split("T")[0]);
      }
    }
    const lastFiveDayCounts = lastFiveDay.map(async (element) => {
      return {
        count: (await getCounts(element, location)).length,
        date: element,
        day: getDayByDate(element),
      };
    });
    return sendResponse(
      HttpStatusCode.OK,
      messageResponse.COUNTS_FETCHED_SUCCESS,
      await Promise.all(lastFiveDayCounts.reverse()),
      response,
    );
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const getDayByDate = (dateToBeUsed: string) => {
  const date = new Date(dateToBeUsed);
  const options: Intl.DateTimeFormatOptions = { weekday: "long" };
  const dayName = date.toLocaleDateString("en-US", options);
  return dayName;
};


const getCounts = async (date, location) => {
  const foundUsers = await mealModel.find({
    bookedDates: { $elemMatch: { date: date } },
  });
  const users = foundUsers.map(async (element) => {
    const foundUser = await userPoolModel.findOne({ email: element.email });
    return { email: element.email, location: foundUser.location };
  });
  const foundGuests = await guestModel.find({
    bookedDates: { $elemMatch: { date: date } },
  });
  const guests = foundGuests.map((element) => {
    return {
      email: element.email,
      location: element.location,
    };
  });
  const res1 = await Promise.all(users);
  const result = res1.concat(guests);
  const count = result.filter((user) => user.location === `${location}`);
  return count;
};


const cancelAllMealsOfDate = async (request: Request, response: Response) => {
  try {
    const { date } = request.query;
    const foundUsers = await mealModel.find({
      bookedDates: { $elemMatch: { date: date } },
    });
    foundUsers.map(async (element) => {
      if (element.bookedDates.some((ele) => ele.date === date)) {
        const index = element.bookedDates.findIndex((item) => item.date === date);
        element.bookedDates.splice(index, 1);
        await element.save();
      }
    });
    return sendResponse(HttpStatusCode.OK, messageResponse.COUNTS_DELETED_SUCCESS, "", response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const getTodayNotCountedUsers = async (request: Request, response: Response) => {
  try {
    const today = new Date();
    const day = new Date(today);
    const date = day.toISOString().split("T")[0];
    const foundUsers = await mealModel.find({
      "bookedDates.date": { $ne: date },
    });
    const users = foundUsers.map(async (element) => {
      const foundUser = await userPoolModel.findOne({ email: element.email });
      return { fullName: foundUser.fullName, email: element.email };
    });
    return sendResponse(
      HttpStatusCode.OK,
      messageResponse.DATE_FETCHED_SUCCESS,
      await Promise.all(await users),
      response,
    );
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const getMonthlyCounts = async (request: Request, response: Response) => {
  try {
    const { location } = request.query;
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEndDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    const datesOfLastMonth = [];
    for (let i = lastMonth.getDate(); i <= lastMonthEndDate.getDate(); i++) {
      const year = lastMonth.getFullYear();
      const month =
        lastMonth.getMonth() + 1 <= 9 ? `0${lastMonth.getMonth() + 1}` : lastMonth.getMonth() + 1;
      const day = i <= 9 ? `0${i}` : i;
      const formattedDate = `${year}-${month}-${day}`;
      const weekDay = new Date(formattedDate).getDay();
      if (weekDay !== 6 && weekDay !== 0) {
        datesOfLastMonth.push(`${year}-${month}-${day}`);
      }
    }
    const lastMonthCounts = datesOfLastMonth.map(async (element) => {
      const result = {
        count: (await getCounts(element, location)).length,
        date: element,
        day: getDayByDate(element),
      };
      const newMonthlyMeal = new monthlyMealModel(result);
      await newMonthlyMeal.save();
      return result;
    });
    return sendResponse(
      HttpStatusCode.OK,
      messageResponse.COUNTS_FETCHED_SUCCESS,
      await Promise.all(lastMonthCounts),
      response,
    );
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

const handleMissedCount = async (request: Request, response: Response) => {
  try {
    const { location } = request.query;
    const { date, email } = request.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return sendErrorResponse(HttpStatusCode.BAD_REQUEST, messageResponse.INVALID_USER, response);
    }
    let missedCountEntity = await missedCount.findOne({ date, location: location as string });
    if (!missedCountEntity) {
      missedCountEntity = new missedCount({
        date,
        location,
        users: [{ email, name: `${user.firstName} ${user.lastName}` }],
      });
    } else {
      missedCountEntity.users.push({
        email,
        name: `${user.firstName} ${user.lastName}`,
      });
    }
    await missedCountEntity.save();
    return sendResponse(200, messageResponse.NOTIFIED_MISSED_COUNT, missedCountEntity, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

const getMissedCounts = async (request: Request, response: Response) => {
  try {
    const { date, location } = request.query;
    const foundMissedCount = await missedCount.findOne({
      date: date as string,
      location: location as string,
    });
    const countOfDate = await getCounts(date, location);
    let countsMissed: any = foundMissedCount?.users.filter(
      ({ email }) => !countOfDate.find((obj) => obj.email === email),
    );
    if (!countsMissed) {
      countsMissed = new missedCount({
        date,
        location,
        users: [],
      });
      await countsMissed.save();
    }
    return sendResponse(
      HttpStatusCode.OK,
      messageResponse.MISSED_COUNTS_FETCHED,
      countsMissed,
      response,
    );
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

const bookForGuest = async (request: AuthorizedRequest, response: Response) => {
  try {
    const { guestType, location } = request.query;
    const { email: bookedByEmail } = request.user;
    const bookedByUser = await userModel.findOne({ email: bookedByEmail });
    let guest;
    if (guestType === "employee") {
      const { email, dates } = request.body;
      const employee = await userPoolModel.findOne({ email });
      if (!employee) {
        return sendErrorResponse(
          HttpStatusCode.NOT_FOUND,
          messageResponse.EMPLOYEE_NOT_FOUND,
          response,
        );
      }
      guest = await guestModel.findOne({ email, location: location as string });
      if (guest) {
        dates.map((date) => {
          guest.bookedDates.push({
            date: date,
            bookedBy: `${bookedByUser.firstName} ${bookedByUser.lastName}`,
            bookedByEmail,
          });
        });
      } else {
        const bookedDates = dates.map((date) => {
          return {
            date: date,
            bookedBy: `${bookedByUser.firstName} ${bookedByUser.lastName}`,
            bookedByEmail,
          };
        });
        guest = new guestModel({
          email,
          location,
          bookedDates,
        });
      }
      await guest.save();
    } else if (guestType === "nonEmployee") {
      const { count, dates } = request.body;
      const bookedDates = dates.map((date) => {
        return {
          date: date,
          bookedBy: `${bookedByUser.firstName} ${bookedByUser.lastName}`,
          bookedByEmail,
        };
      });
      for (let i = 0; i < count; i++) {
        guest = new guestModel({
          email: messageResponse.GUEST_EMAIL,
          location,
          bookedDates,
        });
        await guest.save();
      }
    }
    return sendResponse(HttpStatusCode.OK, messageResponse.MEAL_BOOKED_FOR_GUESTS, guest, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

const cancelGuestMeal = async (request: Request, response: Response) => {
  try {
    const { guestType, location } = request.query;
    if (guestType === "employee") {
      const { email, date } = request.body;
      const employee = await userPoolModel.findOne({ email });
      if (!employee) {
        return sendErrorResponse(
          HttpStatusCode.NOT_FOUND,
          messageResponse.EMPLOYEE_NOT_FOUND,
          response,
        );
      }
      const mealFound = await guestModel.findOne({ email, location: location as string });
      if (!mealFound) {
        return sendErrorResponse(
          HttpStatusCode.NOT_FOUND,
          messageResponse.MEAL_NOT_BOOKED,
          response,
        );
      }
      if (mealFound.bookedDates.some((ele) => ele.date === date)) {
        const index = mealFound.bookedDates.findIndex((item) => item.date === date);
        mealFound.bookedDates.splice(index, 1);
        await mealFound.save();
        return sendResponse(
          HttpStatusCode.OK,
          messageResponse.COUNT_CANCELLED,
          mealFound,
          response,
        );
      }
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.MEAL_NOT_BOOKED, response);
    } else if (guestType === "nonEmployee") {
      const { guestId, date } = request.body;
      const guest = await guestModel.findOne({ _id: guestId, location: location as string });
      if (!guest) {
        return sendErrorResponse(
          HttpStatusCode.NOT_FOUND,
          messageResponse.GUEST_NOT_FOUND,
          response,
        );
      }
      if (guest.bookedDates.some((ele) => ele.date === date)) {
        const index = guest.bookedDates.findIndex((item) => item.date === date);
        guest.bookedDates.splice(index, 1);
        await guest.save();
        return sendResponse(HttpStatusCode.OK, messageResponse.COUNT_CANCELLED, guest, response);
      }
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.MEAL_NOT_BOOKED, response);
    }
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

export default {
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
};
