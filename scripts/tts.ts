// Imports the Google Cloud client library
import * as textToSpeech from "@google-cloud/text-to-speech"
const { SsmlVoiceGender, AudioEncoding } = textToSpeech.protos.google.cloud.texttospeech.v1;
import * as fs from "fs"
import * as util from "util"
// Creates a client
const client = new textToSpeech.TextToSpeechClient()

export const languageId = "dansk"
export async function generateSpeech(english: string, text: string): Promise<{audio: string, audioSlow: string}> {
    try {
        let id = text.replaceAll(" ", "-").toLowerCase()
        id = id.replaceAll(":", "-")
        id = id.replaceAll(",", "-")
        id = id.replaceAll(".", "")
        id = id.replaceAll("!", "")
        id = id.replaceAll("?", "")
        
        // Slow request
        await makeRequest("public/audio/" + languageId + "-slow-" + id + '.mp3', text, false, true)
        await makeRequest("public/audio/" + languageId + "-" + id + '.mp3', text, false, false)
        await makeRequest("public/english/" + languageId + "-" + id + '.mp3', english, true, false)
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
