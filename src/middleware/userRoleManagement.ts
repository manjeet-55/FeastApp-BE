import { Request, Response, NextFunction } from "express";
import messageResponse from "../utils/constants.js";
import config from "../utils/config.js";
import { userModel } from "../models/index.js";
import jwt from "../utils/jwt.js";
import { sendErrorResponse } from "../utils/response.js";

export const isAdmin = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const token = request.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return sendErrorResponse(401, messageResponse.UNAUTHARIZED, response);
    }
    const decoded = jwt.jwtVerify(token, config.SECRET);
    const userIsAdmin = await userModel.findOne({ email: decoded.email });
    if (!userIsAdmin || !userIsAdmin.isAdmin) {
      return sendErrorResponse(401, messageResponse.UNAUTHARIZED, response);
    }
    next();
  } catch (error) {
    return sendErrorResponse(500, messageResponse.ERROR_FETCHING_DATA, response);
  }
};