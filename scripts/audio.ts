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


const Q1 = z.object({ token: z.string() })
const B1 = z.object({
    words: z.array(z.object({
        english: z.string(),
        danish: z.string(),
        audio: z.string(),
        audioSlow: z.string(),
        _id: z.string()
    }))
})
export async function generateAudio(req: MyRequest<typeof Q1, typeof B1>, res: Response, next: NextFunction) {
    validateSchema(req, [Q1, B1])
    const path = (word: string) => ("public/audio/" + word).replaceAll(" ", "\\ ")
    const englishPath = (word: string) => ("public/english/" + word).replaceAll(" ", "\\ ")
    const durations: number[] = await Promise.all(req.body.words.map(async (word): Promise<number> => await duration(path(word.audio))))

    console.log(durations.filter(idk => idk > 9))

    if (durations.filter(idk => idk > 9).length > 0) { throw new WebError("Audio too long", 500) }

    const returnArr = []
    for (let i = 0; i < req.body.words.length; i++) {
        for(let j = 0; j <= i; j++) {
            const word = req.body.words[j]
            returnArr.push(englishPath(word.audio))
            returnArr.push("public/silent/" + Math.round(durations[i]) + ".mp3")
            returnArr.push(path(word.audio))
            returnArr.push("public/silent/" + Math.round(durations[i]) + ".mp3")
        }
        returnArr.push("public/beep.mp3")
        returnArr.push("public/silent/2.mp3")
    }
    await combine(returnArr, "scripts/out.mp3")
    return res.sendFile(__dirname + "/out.mp3")

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