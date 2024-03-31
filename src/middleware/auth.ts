import { Response, NextFunction } from "express";
import { jwt, messageResponse, sendErrorResponse, config } from "../utils";
import { AuthorizedRequest, HttpStatusCode } from "../utils/types";
export const Auth = (request: AuthorizedRequest, response: Response, next: NextFunction) => {
  const token = request?.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return sendErrorResponse(HttpStatusCode.FORBIDDEN, messageResponse.PAGE_NOT_FOUND, response);
  } else {
    const verified = jwt.jwtVerify(token, config.SECRET);
    if (verified) {
      request.user = verified;
      next();
    } else {
      return sendErrorResponse(HttpStatusCode.FORBIDDEN, messageResponse.TOKEN_EXPIRED, response);
    }
  }
};
