import { Request } from "express";
import mongoose from "mongoose";
import { middleware } from "express-paginate";

export function getPaginatedDocumentsFromRequest<T extends mongoose.Document>(
  req: Request,
  modelName: string,
  queryOpts = {},
  sortOpts = {},
  projectionOpts = {}
): Promise<T[]> {
  const { offset } = req;
  const { page, limit } = req.query;

  return getPaginatedDocuments<T>(
    modelName,
    page,
    limit,
    queryOpts,
    offset,
    sortOpts,
    projectionOpts
  );
}

export function getPaginatedDocumentsWithAggregationFromRequest<
  T extends mongoose.Document
>(
  req: Request,
  modelName: string,
  aggregationOpts: Array<any> = [{ $match: {} }]
): Promise<T[]> {
  const { offset } = req;
  const { page, limit } = req.query;

  return getPaginatedDocumentsWithAggregation<T>(
    modelName,
    parseInt(page),
    parseInt(limit),
    aggregationOpts,
    offset
  );
}

export function getPaginatedDocuments<T extends mongoose.Document>(
  modelName: string,
  page = 1,
  limit = 10,
  queryOpts = {},
  offset?: number,
  sortOpts = {},
  projectionOpts = {}
) {
  const model = mongoose.model<T>(modelName);
  const skip = offset || (page - 1) * limit;

  return model
    .find(queryOpts, projectionOpts)
    .skip(skip)
    .limit(limit)
    .sort(sortOpts)
    .exec();
}

export function getPaginatedDocumentsWithAggregation<
  T extends mongoose.Document
>(
  modelName: string,
  page = 1,
  limit = 10,
  aggregationOpts: Array<any> = [{ $match: {} }],
  offset?: number
) {
  const model = mongoose.model<T>(modelName);
  const skip = offset || (page - 1) * limit;

  return model
    .aggregate([...aggregationOpts, { $skip: skip }, { $limit: limit }])
    .exec();
}
