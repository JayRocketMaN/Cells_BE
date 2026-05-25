// src/types/express.d.ts

export {}; // This tells TS it's a module

declare global {
  namespace Express {
    interface Request {
      // We are telling Express: "Hey, you are now allowed to have a 'user' property!"
      user?: {
        id: string;
        companyId: string; // Now you can store the companyId here safely
      };
    }
  }
}


