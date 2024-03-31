import { userModel } from "../../models";
import { Request, Response } from "express";
import { sendResponse, sendErrorResponse, messageResponse, jwt, passwordUtils } from "../../utils";
import { HttpStatusCode } from "../../utils/types";
const loginController = async (request: Request, response: Response) => {
  try {
    const { email, password } = request.body;
    const user = await userModel.findOne({ email }).select("-password");
    console.log("user", user);
    if (!user) {
      return sendErrorResponse(HttpStatusCode.NOT_FOUND, messageResponse.NOT_EXIST, response);
    }
    const checker = passwordUtils.validatePassword(user, password);
    if (checker) {
      const token = jwt.createToken(email, user.id);
      return sendResponse(
        HttpStatusCode.OK,
        messageResponse.LOGIN_SUCCESSFULLY,
        {
          token,
          user,
        },
        response,
      );
    }
    return sendErrorResponse(
      HttpStatusCode.UNAUTHORIZED,
      messageResponse.INVALID_PASSWORD,
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

export default loginController;
