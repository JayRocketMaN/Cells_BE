import { Response } from 'express';

/**
 * Sends a standardized success payload back to the client
 */
export const sendSuccess = (
  res: Response, 
  data: any, 
  message: string = 'Operation successful', 
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};
