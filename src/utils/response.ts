import { Response } from 'express';

interface ResponseData {
  status: string;
  message: string;
  data?: any;
}

const sendResponse = (statusCode: number, message: string, data: any, response: Response) => {
  const result: ResponseData = {
    status: "success",
    message: message,
    data: data,
  };
  return response.status(statusCode).json(result);
};

const sendErrorResponse = (statusCode: number, message: any, response: Response) => {
  const error: ResponseData = {
    status: "failure",
    message: message,
  };
  return response.status(statusCode).json(error);
};

export { sendResponse, sendErrorResponse };
