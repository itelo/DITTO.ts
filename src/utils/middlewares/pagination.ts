import { NextFunction, Request, Response, Router } from "express";
import { middleware } from "express-paginate";
import mongoose from "mongoose";

export type RequestWithDocuments<T extends mongoose.Document> = Request & {
  docs: T[];
};
/**
 * Paginates documents using express-paginate and puts query results into `req.docs`
 *
 * @param modelName - Mongoose model name
 * @param limit     - Default limit to be used on paginated requests
 * @param maxLimit  - Max limit number to be used on paginated requests
 * @returns express.Router - Router to be used as middleware on express requests
 */
export function paginationMiddlewareFactory<T extends mongoose.Document>(
  modelName: string,
  limit = 10,
  maxLimit = 50
): Router {
  const router = Router();
  const model = mongoose.model<T>(modelName);

  router.use(middleware(limit, maxLimit));

  router.use(
    async (req: RequestWithDocuments<T>, res: Response, next: NextFunction) => {
      const { offset } = req;
      const { page, limit } = req.query;
      const skip = offset || (page - 1) * limit;

      req.docs = await model
        .find({})
        .skip(skip)
        .limit(limit)
        .exec();

      next();
    }
  );

  return router;
}
