// Requires
import cors from "cors";
import express from "express";
import { Application, NextFunction, Request, Response } from "express";
import * as mongoose from "mongoose";
import 'dotenv/config';

// User requires
import * as auth from "./scripts/auth";
import * as userAPI from "./scripts/userAPI";
import * as audio from "./scripts/audio";
import { WebError } from "./scripts/utils";

interface WebErrorInterface extends Error {
    status?: number
}

try {
    mongoose.connect(`mongodb+srv://${process.env.MGDB_USERNAME}:${process.env.MGDB_PASSWORD}@main.8e8t3.mongodb.net/main?retryWrites=true&w=majority&appName=main`).then(() => console.debug("Connected to MongoDB"))
} catch (err) {
    console.error(err)
}

const app: Application = express()

const CURRENT_URL = process.env.CURRENT_URL || "*"
const BASE_ROUTE = process.env.IS_COMPILED === "true" ? "" : "/danish-squares"

// ========== Set-up middleware (You can move this into a different file if you want to) ==========
// If you want to send JSON, you need this middleware, which sents the Content-Type header.
app.use((_, res, next) => {
    res.setHeader('Content-Type', 'application/json')
    next()
})
// Accept JSON from a post request.
app.use(express.urlencoded({ extended: true })) // turn url parameters (e.g. ?name=alan) into req.body.
app.use(express.json()) // parse incoming data into json.
var allowCrossDomain = function (req: Request, res: Response, next: NextFunction) {
    // Something called CORS I'm not sure what it is but we need this code here.
    res.header('Access-Control-Allow-Origin', CURRENT_URL)
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    next()
}
app.use(allowCrossDomain)
app.use(cors({ credentials: true, origin: CURRENT_URL }))
app.use('/public', express.static('public')) // serve static files

// An updated async route handler wrapper that allows you to specify the structure of the request.
// All generic types default to {} to (hopefully) ensure you specify their type.
function asyncHandler<Params = {}, ResBody = {}, ReqBody = {}, ReqQuery = {}>(
    fn: (req: Request<Params, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request<Params, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
}



app.post(BASE_ROUTE + "/users/sign-up/email", asyncHandler(userAPI.signUpWithEmail))
app.get(BASE_ROUTE + "/users/sign-in/username", asyncHandler(userAPI.signInWithEmail))

// app.use(asyncHandler(auth.verifySession))

// Users
console.log(BASE_ROUTE)
app.get(BASE_ROUTE + "/test", (req: Request, res: Response, next: NextFunction) => res.send("Welcome to Danish Squares!"));

app.get(BASE_ROUTE + "/auth/get-updates", asyncHandler(userAPI.updateUser))
app.post(BASE_ROUTE + "/users/sign-out", asyncHandler(auth.verifySession), asyncHandler(userAPI.signOut))
app.post(BASE_ROUTE + "/main/add-words", asyncHandler(auth.verifySession), asyncHandler(userAPI.addWord))
app.get(BASE_ROUTE + "/main/generate-audio", asyncHandler(auth.verifySession), asyncHandler(audio.generateAudio))

// app.get(BASE_ROUTE + "/dev", asyncHandler(doStuff))

app.use(function (req, res, next) {
    next(new WebError("Path not found: " + req.path, 404))
})

// error handler
// define as the last app.use callback
app.use(function (err: WebErrorInterface | Error, req: Request, res: Response, next: NextFunction): void {
    console.error(err)
    res.status(500)
    if (typeof err === 'object' && 'status' in err && err.status) { res.status(err.status) }
    res.send(err.message)
})

const port = process.env.PORT || 3002
app.listen(port)
console.debug((process.env.IS_COMPILED ? "Compiled " : "") + "Server started on port " + port + "!")