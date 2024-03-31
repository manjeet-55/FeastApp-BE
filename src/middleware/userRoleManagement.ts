import { Request, Response, NextFunction } from "express";
import { messageResponse, config, jwt, sendErrorResponse } from "../utils";
import { HttpStatusCode } from "../utils/types";
import { userModel } from "../models/index";

export const isAdmin = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const token = request.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return sendErrorResponse(HttpStatusCode.UNAUTHORIZED, messageResponse.UNAUTHARIZED, response);
    }
    const decoded = jwt.jwtVerify(token, config.SECRET);
    const userIsAdmin = await userModel.findOne({ email: decoded.email });
    if (!userIsAdmin || !userIsAdmin.isAdmin) {
      return sendErrorResponse(HttpStatusCode.UNAUTHORIZED, messageResponse.UNAUTHARIZED, response);
    }
    next();
  } catch (error) {
    return sendErrorResponse(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      messageResponse.ERROR_FETCHING_DATA,
      response,
    );
  }
};
