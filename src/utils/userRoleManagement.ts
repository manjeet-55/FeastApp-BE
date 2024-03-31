import { Request, Response, NextFunction } from "express";
import messageResponse from "./constants";
import config from "./config";
import { userModel } from "../models/index.js";
import jwt from "./jwt.js";
import {sendErrorResponse } from "./response";

const isAdmin = async (request: Request, response: Response, next: NextFunction) => {
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

export default isAdmin;
