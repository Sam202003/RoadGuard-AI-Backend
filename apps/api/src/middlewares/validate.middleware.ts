import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { parseOrThrow } from '../helpers/validation.helper.js';

export type RequestValidationSchemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export function validate(schemas: RequestValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = parseOrThrow(schemas.body, req.body, 'body');
      }
      if (schemas.query) {
        req.query = parseOrThrow(schemas.query, req.query, 'query') as Request['query'];
      }
      if (schemas.params) {
        req.params = parseOrThrow(schemas.params, req.params, 'params') as Request['params'];
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
