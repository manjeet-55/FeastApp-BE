import {
  sendResponse,
  sendErrorResponse,
  messageResponse,
  sendEmail,
  passwordUtils,
  config,
  globalCatch,
} from "../../utils";
import { userPoolModel, userModel, tokenModel } from "../../models";
import crypto from "crypto";
import { Request, Response } from "express";
import { HttpStatusCode } from "../../utils/types";


const getAllUsers = async (request: Request, response: Response) => {
  try {
    const { location } = request.query;
    const foundUsers = await userPoolModel.find({ location: location as string });
    return sendResponse(
      HttpStatusCode.OK,
      messageResponse.USERS_FOUND_SUCCESS,
      foundUsers,
      response,
    );
  } catch (error) {
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const getUser = async (request: Request, response: Response) => {
  try {
    const { email } = request.body;
    const foundUser = await userPoolModel.findOne({ email });
    if (!foundUser) {
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.NOT_EXIST, response);
    }
    return sendResponse(HttpStatusCode.OK, messageResponse.USER_FOUND, foundUser, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

const getJoinedUsers = async (request: Request, response: Response) => {
  try {
    const { location } = request.query;
    // exclude this email in user list
    const { email } = request.body;
    const users = await userPoolModel.find({
      location: location as string,
      hasJoined: true,
      email: { $ne: email },
    });
    return sendResponse(HttpStatusCode.OK, messageResponse.USERS_FOUND_SUCCESS, users, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const insertUser = async (request: Request, response: Response) => {
  try {
    const { email, fullName, location } = request.body;
    const user = await userPoolModel.findOne({ email });
    if (user) {
      return sendErrorResponse(HttpStatusCode.CONFLICT, messageResponse.EMAIL_EXIST, response);
    }
    const newUser = new userPoolModel({
      fullName,
      email,
      location,
    });
    await newUser.save();
    return sendResponse(HttpStatusCode.CREATED, messageResponse.CREATED_SUCCESS, newUser, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const updateUserPool = async (request: Request, response: Response) => {
  try {
    const { email, fullName, location } = request.body;
    const user = await userPoolModel.findOneAndUpdate({ email }, { fullName, location });
    if (user) {
      return sendResponse(HttpStatusCode.OK, messageResponse.USER_UPDATED_SUCCESS, user, response);
    }
    return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.NOT_EXIST, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const deleteUser = async (request: Request, response: Response) => {
  try {
    const { email } = request.query;
    const user = await userPoolModel.findOne({ email: email as string });
    if (!user) {
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.NOT_EXIST, response);
    }
    await userPoolModel.deleteOne({ email: email as string });

    return sendResponse(HttpStatusCode.OK, messageResponse.USER_DELETED_SUCCESS, "", response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

//Done
const getNotJoinedUsers = async (request: Request, response: Response) => {
  try {
    const { location } = request.query;
    const { email } = request.body;
    const users = await userPoolModel.find({
      location: location as string,
      hasJoined: false,
      email: { $ne: email },
    });
    return sendResponse(HttpStatusCode.OK, messageResponse.USER_FOUND, users, response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};


const inviteUser = async (request: Request, response: Response) => {
  try {
    const { email } = request.body;
    const foundUser = await userPoolModel.findOne({ email });
    if (!foundUser) {
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.NOT_EXIST, response);
    }
    const res = await sendEmail(messageResponse.INVITE_SUBJECT, foundUser.fullName, email, 3, []);
    if (res.status === "failure") {
      return sendErrorResponse(HttpStatusCode.BAD_REQUEST, res.message, response);
    }
    return sendResponse(HttpStatusCode.OK, messageResponse.INVITED_SUCCESS, "", response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

const forgotPassword = async (request: Request, response: Response) => {
  try {
    const user = await userModel.findOne({ email: request.body.email });
    if (!user)
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.NOT_EXIST, response);

    let token = await tokenModel.findOne({ userId: user._id });
    if (!token) {
      token = await new tokenModel({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
    }
    const link = `${config.RESET_PASSWORD_URL}/${user._id}/${token.token}`;
    const res = await sendEmail(
      messageResponse.FORGOT_PASS_SUBJECT,
      user.firstName,
      request.body.email,
      4,
      { url: link },
    );
    if (res.status === "failure") {
      return sendErrorResponse(HttpStatusCode.BAD_REQUEST, res.message, response);
    }
    return sendResponse(HttpStatusCode.OK, messageResponse.MAIL_SENT_SUCCESS, "", response);
  } catch (error) {
    globalCatch(request, error);
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

const updatePassword = async (request: Request, response: Response) => {
  try {
    const user = await userModel.findById(request.params.userId);
    if (!user)
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.NOT_EXIST, response);
    const token = await tokenModel.findOne({
      userId: user._id,
      token: request.params.token,
    });
    if (!token)
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.LINK_EXPIRED, response);

    const newHashedPassword = await passwordUtils.hashPassword(request.body.newPassword);
    const updatedUser = await userModel.findByIdAndUpdate(
      request.params.userId,
      { password: newHashedPassword },
      { new: true },
    );
    await tokenModel.findOneAndDelete({
      userId: user._id,
      token: request.params.token,
    });
    return sendResponse(
      HttpStatusCode.OK,
      messageResponse.PASSWORD_RESET_SUCCESS,
      updatedUser,
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

const checkPassword = async (request: Request, response: Response) => {
  try {
    const { email, oldPassword } = request.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.NOT_EXIST, response);
    }
    const validPassword = passwordUtils.validatePassword(user, oldPassword);
    if (validPassword) {
      return sendResponse(HttpStatusCode.OK, messageResponse.CORRECT_PASSWORD, "", response);
    }
    return sendErrorResponse(
      HttpStatusCode.BAD_REQUEST,
      messageResponse.INVALID_PASSWORD,
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

const resetPassword = async (request: Request, response: Response) => {
  try {
    const { email, newPassword } = request.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.NOT_EXIST, response);
    }
    const newHashedPassword = await passwordUtils.hashPassword(newPassword);
    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      { password: newHashedPassword },
      { new: true },
    );
    return sendResponse(HttpStatusCode.OK, messageResponse.PASSWORD_UPDATED, updatedUser, response);
  } catch (error) {
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

export default {
  getAllUsers,
  getUser,
  getJoinedUsers,
  insertUser,
  updateUserPool,
  deleteUser,
  getNotJoinedUsers,
  inviteUser,
  forgotPassword,
  updatePassword,
  checkPassword,
  resetPassword,
};
