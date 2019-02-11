export interface ErrorHandler extends Error {
  code: string | number;
  errmsg: string;
  errors: {
    [key: string]: {
      message: string;
    };
  };
}
