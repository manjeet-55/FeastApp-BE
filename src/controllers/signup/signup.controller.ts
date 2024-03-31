import { Request, Response } from "express";
import { userModel, userPoolModel } from "../../models";
import bcrypt from "bcryptjs";
import { sendResponse, sendErrorResponse, messageResponse } from "../../utils";
import { HttpStatusCode } from "../../utils/types";
const signupController = async (request: Request, response: Response) => {
  try {
    const { firstName, lastName, email, password, gender, phone, location, photo } = request.body;
    const user = await userModel.findOne({ email });
    if (user) {
      return sendErrorResponse(HttpStatusCode.CONFLICT, messageResponse.EMAIL_EXIST, response);
    }
    const foundUser = await userPoolModel.findOne({ email });
    if (!foundUser) {
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.NOT_EXIST, response);
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await userModel.create({
      firstName,
      lastName,
      gender,
      email,
      password: hashedPassword,
      location,
      phone,
      photo,
    });
    await userPoolModel.findOneAndUpdate({ email }, { hasJoined: true });
    return sendResponse(HttpStatusCode.CREATED, messageResponse.CREATED_SUCCESS, newUser, response);
  } catch (error) {
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};

export default signupController;
