// Imports the Google Cloud client library
import * as textToSpeech from "@google-cloud/text-to-speech"
const { SsmlVoiceGender, AudioEncoding } = textToSpeech.protos.google.cloud.texttospeech.v1;
import * as fs from "fs"
import * as util from "util"
// Creates a client
const client = new textToSpeech.TextToSpeechClient()

export const languageId = "dansk"
export async function generateSpeech(text: string): Promise<{audio: string, audioSlow: string}> {
    try {
        let id = text.replaceAll(" ", "-").toLowerCase()
        id = id.replaceAll(":", "-")
        id = id.replaceAll(",", "-")
        id = id.replaceAll(".", "")
        id = id.replaceAll("!", "")
        id = id.replaceAll("?", "")

        // First request with normal speaking rate
        let request = {
            input: { text: text },
            voice: { languageCode: 'da-DK', ssmlGender: SsmlVoiceGender.FEMALE, name: "da-DK-Neural2-D" },
            audioConfig: { audioEncoding: AudioEncoding.MP3, speakingRate: 0.5 },
        }

        let response = await client.synthesizeSpeech(request)
        if (!response || !response[0]) {
            throw new Error('Failed to synthesize speech')
        }

        if (response[0].audioContent) {
            fs.writeFileSync("public/audio/" + languageId + "-slow-" + id + '.mp3', response[0].audioContent, 'binary')
        } else {
            console.error("Error: Could not write audio content.")
        }

        // First request with normal speaking rate
        request = {
            input: { text: text },
            voice: { languageCode: 'da-DK', ssmlGender: SsmlVoiceGender.FEMALE, name: "da-DK-Neural2-D" },
            audioConfig: { audioEncoding: AudioEncoding.MP3, speakingRate: 1 },
        }

        response = await client.synthesizeSpeech(request)
        if (!response || !response[0]) {
            throw new Error('Failed to synthesize speech')
        }

        if (response[0].audioContent) {
            fs.writeFileSync("public/audio/" + languageId + "-" + id + '.mp3', response[0].audioContent, 'binary')
        } else {
            console.error("Error: Could not write audio content.")
        }
        return { audio: languageId + "-" + id + '.mp3', audioSlow: languageId + "-slow-" + id + '.mp3' }
    } catch (error) {
        console.error('ERROR:', error)
        throw new Error("Something happened.")
    }
}

// generateSpeech("hej!")
