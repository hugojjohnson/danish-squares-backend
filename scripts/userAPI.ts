import { NextFunction, Request, Response } from "express"
// import { OAuth2Client } from "google-auth-library"
import 'dotenv/config'

import UserModel from "../schemas/User"
import SessionModel from "../schemas/Session"
import * as auth from "./auth"
import { MyRequest, validateSchema, WebError } from "./utils"
import { string, z } from "zod"
import WordModel from "../schemas/Word"
import { generateSpeech, getID } from "./tts"

// ========== Caches ==========
let publicBookCache: { _id: string, owner: string, name: string, length: number }[] | undefined = undefined

// ========== Functions ==========
const Q1 = z.object({})
const B1 = z.object({
    username: z.string(),
    hash: z.string()
})
export async function signUpWithEmail(req: MyRequest<typeof Q1, typeof B1>, res: Response, next: NextFunction) {
    validateSchema(req, [Q1,B1])
    if (req.body.username === undefined || req.body.hash === undefined) {
        throw new WebError("Details not entered correctly. Please try again.", 500)
    }

    if (await UserModel.exists({ username: req.body.username })) {
        throw new WebError("That username is already taken. Please try a different one.", 500)
    }
    const newUser = new UserModel({
        username: req.body.username,
        hash: req.body.hash
    })
    newUser.save()
    return res.send("hi there! success")
}

const Q2 = z.object({
    username: z.string(),
    hash: z.string()
})
const B2 = z.object({})
export async function signInWithEmail(req: MyRequest<typeof Q2, typeof B2>, res: Response, next: NextFunction) {
    validateSchema(req, [Q2, B2])
    if (req.query.username === undefined || req.query.hash === undefined) {
        throw new WebError("Details not entered correctly. Please try again.", 500)
    }
    const user = await UserModel.findOne({ username: req.query.username, hash: req.query.hash })
    if (user === null) {
        throw new WebError("Email or password incorrect. Please try again.", 500)
    }
    const newSession = new SessionModel({
        user: user,
    })
    await newSession.save()
    return res.send(JSON.stringify({
        token: {
            value: newSession.id
        },
        user: {
            username: user.username
        },
    }))
}



const Q3 = z.object({
    token: z.string()
})
const B3 = z.object({})
export async function signOut(req: MyRequest<typeof Q3, typeof B3>, res: Response, next: NextFunction) {
    validateSchema(req, [Q3])

    let session = await SessionModel.findById(req.query.token)
    if (session !== null) {
        session.active = false
        await session.save()
        return res.send("hi there! success")
    }
    throw new WebError("Session could not be found.", 500)
}

const Q5 = z.object({ token: z.string() })
const B5 = z.object({})
export async function updateUser(req: MyRequest<typeof Q5, typeof B5>, res: Response, next: NextFunction) {
    validateSchema(req, [Q5, B5])
    const userId = await auth.tokenToUserId(req.query.token)
    const userWords = await WordModel.find({ owner: userId })
    return res.json(userWords)
}



const Q4 = z.object({
    token: z.string()
})
const B4 = z.object({
    dW: z.string(),
    dS: z.string(),
    eW: z.string(),
    eS: z.string()
})
export async function addWord(req: MyRequest<typeof Q4, typeof B4>, res: Response, next: NextFunction) {
    validateSchema(req, [Q4, B4])
    const dW = req.body.dW.split("\n")
    const dS = req.body.dS.split("\n")
    const eW = req.body.eW.split("\n")
    const eS = req.body.eS.split("\n")
    
    if (dW[0].length === 0 || dS[0].length === 0 || eW[0].length === 0 || eS[0].length === 0) {
        throw new WebError("All fields must be filled in", 400)
    }
    if (dW.length !== dS.length || dW.length !== eW.length || dW.length !== eS.length) {
        throw new WebError("Lengths do not match.", 400)
    }

    const userId = await auth.tokenToUserId(req.query.token)
    
    const returnJSON = []
    for (let i = 0; i < dW.length; i++) {
        await generateSpeech(dW[i], dS[i], eW[i], eS[i])
        const id = getID(dW[i])
        const newWord = new WordModel({ owner: userId, dW: dW[i], dS: dS[i], eW: eW[i], eS: eS[i], learned: false, starred: false, id: id })
        await newWord.save()
        returnJSON.push(newWord)
    }
    return res.send(returnJSON)
}