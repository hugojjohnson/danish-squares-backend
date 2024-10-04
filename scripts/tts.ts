// Imports the Google Cloud client library
import * as textToSpeech from "@google-cloud/text-to-speech"
const { SsmlVoiceGender, AudioEncoding } = textToSpeech.protos.google.cloud.texttospeech.v1;
import * as fs from "fs"
import * as util from "util"
// Creates a client
const client = new textToSpeech.TextToSpeechClient()

export const languageId = "dansk"

export function getID(dW: string): string {
    let id = dW.replaceAll(" ", "-").toLowerCase()
    id = id.replaceAll(":", "-")
    id = id.replaceAll(",", "-")
    id = id.replaceAll(".", "")
    id = id.replaceAll("!", "")
    id = id.replaceAll("?", "")
    id = languageId + "-" + id + ".mp3"
    return id
}
export async function generateSpeech(dW: string, dS: string, eW: string, eS: string): Promise<void> {
    try {
        const id = getID(dW)
        // Slow request
        await makeRequest("public/audio/dW/" + id, dW, false, false)
        await makeRequest("public/audio/dS/" + id, dS, false, false)
        await makeRequest("public/audio/eW/" + id, eW, true, false)
        await makeRequest("public/audio/eS/" + id, eS, true, false)
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
