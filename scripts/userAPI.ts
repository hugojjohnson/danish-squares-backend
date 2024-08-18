import { NextFunction, Request, Response } from "express"
// import { OAuth2Client } from "google-auth-library"
import 'dotenv/config'

import UserModel from "../schemas/User"
import SessionModel from "../schemas/Session"
import * as auth from "./auth"
import { MyRequest, validateSchema, WebError } from "./utils"
import { string, z } from "zod"
import BookletModel from "../schemas/Booklet"
import { generateSpeech } from "./tts"

// ========== Caches ==========
let publicBookCache: { _id: string, owner: string, name: string, length: number }[] | undefined = undefined

// ========== Functions ==========
const Q1 = z.object({})
const B1 = z.object({
    username: z.string(),
    hash: z.string()
})
export async function signUpWithEmail(req: Request, res: Response, next: NextFunction) {
    // validateSchema(req, [,B1])
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
export async function signInWithEmail(req: Request, res: Response, next: NextFunction) {
    // validateSchema(req, [Q2])
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
    const userBooklets = await BookletModel.find({ owner: userId })
    return res.json(userBooklets)
}



const Q4 = z.object({
    token: z.string()
})
const B4 = z.object({
    booklet: z.object({
        name: z.string(),
        words: z.array(z.object({
            english: z.string(),
            danish: z.string()
        }))
    })
})
export async function addBooklet(req: MyRequest<typeof Q4, typeof B4>, res: Response, next: NextFunction) {
    validateSchema(req, [Q4, B4])
    const userId = await auth.tokenToUserId(req.query.token)

    const returnWords: { english: string, danish: string, audio: string, audioSlow: string }[] = []
    for (const word of req.body.booklet.words) {
        const { audio, audioSlow } = await generateSpeech(word.danish)
        returnWords.push({ english: word.english, danish: word.danish, audio: audio, audioSlow: audioSlow })
    }

    const newBooklet = new BookletModel({
        owner: userId,
        name: req.body.booklet.name,
        public: true,
        words: returnWords
    })
    if (publicBookCache) {
        const ownerUser = await UserModel.findById(newBooklet.owner)
        publicBookCache.push({ _id: newBooklet._id, owner: ownerUser ? ownerUser.username : "", name: newBooklet.name, length: newBooklet.words.length })
    }
    await newBooklet.save()
    return res.json(newBooklet)
    // throw new WebError("Session could not be found.", 500)
}

const Q6 = z.object({ token: z.string(), username: z.string() })
const B6 = z.object({})
export async function getPublicBooklets(req: MyRequest<typeof Q6, typeof B6>, res: Response, next: NextFunction) {
    validateSchema(req, [Q6, B6])
    if (publicBookCache === undefined || publicBookCache.length === 0) {
        publicBookCache = await updateBooklets()
    }
    return res.json(publicBookCache.filter(idk => idk.owner !== req.query.username))
    
    async function updateBooklets() {
        const publicBooklets = await BookletModel.find({ public: true })
        const returnBooklets: { _id: string, owner: string, name: string, length: number }[] = []
        for (const publicBooklet of publicBooklets) {
            const ownerUser = await UserModel.findById(publicBooklet.owner)
            returnBooklets.push({ _id: publicBooklet._id, owner: ownerUser ? ownerUser.username : "", name: publicBooklet.name, length: publicBooklet.words.length })
        }
        return returnBooklets
    }
}

const Q7 = z.object({ id: z.string() })
const B7 = z.object({})
export async function getSharedBook(req: MyRequest<typeof Q7, typeof B7>, res: Response, next: NextFunction) {
    validateSchema(req, [Q7, B7])
    const book = await BookletModel.findById(req.query.id)
    if (book === null) { throw new WebError("Book could not be found", 500) }
    return res.json({
        name: book.name,
        words: book.words.map(word => {
            return {
                danish: word.danish,
                english: word.english,
                audio: word.audio,
                audioSlow: word.audioSlow
            }
        })
    })
}