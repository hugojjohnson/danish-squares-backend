import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export class WebError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        // Ensure stack trace is captured (V8 engine feature)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export type MyRequest<Q extends z.ZodTypeAny, B extends z.ZodTypeAny> = Request<{}, {}, z.infer<B>, z.infer<Q>>;

// Another possible way you could structure it. Both are the same honestly, but I've gone with the latter because
// I don't want to accidentally reference req.body out of habit and have it untyped.
// const [query, body] = validateSchema<z.infer<typeof Q3>, z.infer<typeof Q3>>(req, [Q3])
// In fact, you could probably take out the generics too if you used this function header:
// export function validateSchema<Q extends z.ZodSchema, B extends z.ZodSchema>(req: Request, [querySchema, bodySchema]: [Q?, B?]) {
// So I'm keeping it here for if you decide to use it later on, otherwise don't bother.
export function validateSchema(req: Request, [querySchema, bodySchema]: [z.ZodSchema?, z.ZodSchema?]) {
    try {
        if (querySchema) {
            querySchema.parse(req.query);
        }
        if (bodySchema) {
            bodySchema.parse(req.body);
        }
    } catch (err) {
        console.debug(err)
        // if (err && typeof err === "object" && "errors" in err && typeof err.errors === "string") {
        //     throw new WebError(err.errors, 400);
        // }
        console.debug("====================")
        console.debug("====================")
        console.debug("====================")
        console.debug("Query:")
        console.debug(req.query)
        console.debug("Body:")
        console.debug(req.body)
        console.debug("====================")
        console.debug("====================")
        console.debug("====================")
        throw new WebError("Request was not properly formed.", 400);
    }
}

