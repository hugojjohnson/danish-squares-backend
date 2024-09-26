import { Application, NextFunction, Request, Response } from "express";
import BookletModel from "../schemas/Booklet";
import * as textToSpeech from "@google-cloud/text-to-speech"
const { SsmlVoiceGender, AudioEncoding } = textToSpeech.protos.google.cloud.texttospeech.v1;
import * as util from "util"
import * as fs from "fs"

const client = new textToSpeech.TextToSpeechClient()

export async function doStuff(req: Request, res: Response, next: NextFunction) {
    const booklets = await BookletModel.find({})
    for (const booklet of booklets) {
        for (const word of booklet.words) {
            if (fs.existsSync("./public/english/" + word.audio)) {
                continue
            }
            await generateEnglish(word.english, word.danish)
        }
    }
    console.log("Done!")
    res.json({ success: true })
}


export const languageId = "dansk"
export async function generateEnglish(english: string, text: string): Promise<{ audio: string, audioSlow: string }> {
    try {
        let id = text.replaceAll(" ", "-").toLowerCase()
        id = id.replaceAll(":", "-")
        id = id.replaceAll(",", "-")
        id = id.replaceAll(".", "")
        id = id.replaceAll("!", "")
        id = id.replaceAll("?", "")

        // Slow request
        // makeRequest("public/audio/" + languageId + "-slow-" + id + '.mp3', text, false, true)
        // makeRequest("public/audio/" + languageId + "-" + id + '.mp3', text, false, false)
        makeRequest("public/english/" + languageId + "-" + id + '.mp3', english, true, false)
        return { audio: languageId + "-" + id + '.mp3', audioSlow: languageId + "-slow-" + id + '.mp3' }
    } catch (error) {
        console.error('ERROR:', error)
        throw new Error("Something happened.")
    }
}

async function makeRequest(myPath: string, text: string, english: boolean, slow: boolean) {
    // First request with normal speaking rate
    let request = {
        input: { text: text },
        voice: { languageCode: (english ? 'en-US' : 'da-DK'), ssmlGender: SsmlVoiceGender.FEMALE, name: (english ? "en-AU-Standard-C" : "da-DK-Neural2-D") },
        audioConfig: { audioEncoding: AudioEncoding.MP3, speakingRate: (slow ? 0.5 : 1) },
    }

    let response = await client.synthesizeSpeech(request)
    if (!response || !response[0]) {
        throw new Error('Failed to synthesize speech')
    }

    if (response[0].audioContent) {
        fs.writeFileSync(myPath, response[0].audioContent, 'binary')
    } else {
        console.error("Error: Could not write audio content.")
    }
}

// generateSpeech("hej!")
