import { Schema, Document, model, ObjectId } from "mongoose";

interface I extends Document {
    owner: ObjectId;
    name: string;
    public: boolean;
    words: {
        english: string;
        danish: string;
        audio: string;
        audioSlow: string;
    }[]
}

const S: Schema<I> = new Schema({
    owner: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true},
    public: { type: Boolean, default: false },
    words: [{ english: String, danish: String, audio: String, audioSlow: String }]
})

const BookletModel = model<I>("Booklets", S)

export default BookletModel