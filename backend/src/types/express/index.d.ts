declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      businessId: string;
      role: string;
      [key: string]: any;
    };
  }
}
