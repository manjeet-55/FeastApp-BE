import jwt from "jsonwebtoken";
import config from "./config";
import messageResponse from "./constants";

const createToken = (email: string, userId: string) => {
  const token = jwt.sign({ email, userId }, config.SECRET, {
    expiresIn: config.JWT_EXPIRY,
  });
  return token;
};

const jwtVerify = (token: string, secret: string) => {
  try {
    let result: any;
    jwt.verify(token, secret, (error: any, data: any) => {
      if (error) {
        return;
      }
      result = data;
    });
    return result;
  } catch (error) {
    console.log(messageResponse.ERROR_FETCHING_DATA);
  }
};

export default { createToken, jwtVerify };
