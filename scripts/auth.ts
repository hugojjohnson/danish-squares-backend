import { Request, Response, NextFunction } from "express"
import SessionModel from "../schemas/Session"
import { WebError } from "./utils"

export async function verifySession(req: Request, res: Response, next: NextFunction) {
    if (req.query.token === undefined) {
        throw new WebError("Token not included in request.", 400)
    }
    const session = await SessionModel.find({ value: req.query.token })
    if (session === null) {
        throw new WebError("Token not valid.", 403)
    }
    // if (session.active !== true) {
    //     throw new WebError("Session inactive. You have been logged out.", 403)
    // }
    return next()
}

export async function tokenToUserId(token: string) {
    const session = await SessionModel.findById(token)
    if (session === null) {
        throw new Error("Token is not valid.")
    }
    if (session.active !== true) {
        throw new Error("Session inactive. You have been logged out.")
    }
    return session.user
}

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.body.token === undefined) {
        throw new WebError("Token not included in request.", 500)
    }
    const session = await SessionModel.findById(req.query.token)
    if (session === null) {
        throw new WebError("Token is not valid.", 403)
    }
    if (session.active !== true) {
        throw new WebError("Session inactive. You have been logged out.", 403)
    }
    if (session.user.toString() !== "65bc60ffef5236b8a8edb79b") {
        throw new WebError("You must be an administrator to access this.", 403)
    }
    return next()
}