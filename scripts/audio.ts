import { Request, Response, NextFunction } from "express"
import SessionModel from "../schemas/Session"
import { MyRequest, validateSchema, WebError } from "./utils"
// @ts-ignore
import audioconcat from 'audioconcat';
import { spawn } from 'child_process';
import path from 'path';
import { PassThrough } from 'stream';
import { z } from "zod";
import ffmpeg from "fluent-ffmpeg";
const ffmpegPath = require('ffmpeg-static');
import * as auth from "../scripts/auth"
import WordModel from "../schemas/Word";


const Q1 = z.object({ token: z.string() })
const B1 = z.object({})
export async function generateAudio(req: MyRequest<typeof Q1, typeof B1>, res: Response, next: NextFunction) {
    validateSchema(req, [Q1, B1])
    const dS = (word: string) => ("public/audio/dS/" + word).replaceAll(" ", "\\ ")
    const dW = (word: string) => ("public/audio/dW/" + word).replaceAll(" ", "\\ ")
    const eS = (word: string) => ("public/audio/eS/" + word).replaceAll(" ", "\\ ")
    const eW = (word: string) => ("public/audio/eW/" + word).replaceAll(" ", "\\ ")

    const userId = await auth.tokenToUserId(req.query.token)
    const unlearnedWords = (await WordModel.find({}))
    const learnedWords = (await WordModel.find({}))

    const returnArr: string[] = []
    const practiceArr: string[] = []

    for (let i = 0; i < Math.min(12, unlearnedWords.length); i++) {
        learn(unlearnedWords[i].id)
        if (i % 3 === 2) {
            returnArr.concat(practiceArr)
            returnArr.push("public/beep.mp3")
        }
    }

    function learn(newW: string) {
        returnArr.push(eW(newW))
        returnArr.push("public/silent/5.mp3")
        returnArr.push(dW(newW))
        returnArr.push("public/silent/5.mp3")
        returnArr.push(dS(newW))
        returnArr.push("public/silent/7.mp3")
        
        practiceArr.push(eS(newW))
        practiceArr.push(dS(newW))
        practiceArr.push(dW(newW))
    }

    console.log(unlearnedWords)
    console.log(learnedWords)
    returnArr.push(dS(unlearnedWords[0].id))
    returnArr.push("public/beep.mp3")

    await combine(returnArr, "scripts/out.mp3")
    return res.sendFile(__dirname + "/out.mp3")

    // =====================================
    // const englishPath = (word: string) => ("public/english/" + word).replaceAll(" ", "\\ ")
    // const durations: number[] = await Promise.all(req.body.words.map(async (word): Promise<number> => await duration(path(word.audio))))

    // console.log(durations.filter(idk => idk > 9))

    // if (durations.filter(idk => idk > 9).length > 0) { throw new WebError("Audio too long", 500) }

    // const returnArr = []
    // for (let i = 0; i < req.body.words.length; i++) {
    //     for(let j = 0; j <= i; j++) {
    //         const word = req.body.words[j]
    //         returnArr.push(englishPath(word.audio))
    //         returnArr.push("public/silent/" + Math.round(durations[i]) + ".mp3")
    //         returnArr.push(path(word.audio))
    //         returnArr.push("public/silent/" + Math.round(durations[i]) + ".mp3")
    //     }
    //     returnArr.push("public/beep.mp3")
    //     returnArr.push("public/silent/2.mp3")
    // }
    // await combine(returnArr, "scripts/out.mp3")
    // return res.sendFile(__dirname + "/out.mp3")

    // if (session.active !== true) {
    //     throw new WebError("Session inactive. You have been logged out.", 403)
    // }
    return next()
}

async function duration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .ffprobe((err, data) => {
                if (err) {
                    return reject(err);
                }
                const duration = data.format.duration;
                resolve(duration || 0);
            });
    });
}

// async function combine(inputFiles: string[], outputFile: string) {
//     const command = ffmpeg();
//     inputFiles.forEach(file => {
//         command.input(file);
//     });
//     command.mergeToFile(outputFile, ".");
// }

async function combine(inputFiles: string[], outputFile: string) {
    return new Promise<void>((resolve, reject) => {
        const command = ffmpeg();

        inputFiles.forEach(file => {
            command.input(file);
        });

        command
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .mergeToFile(outputFile, ".");
    });
}