import { Schema, Document, model, ObjectId } from "mongoose";


interface I extends Document {
    owner: ObjectId;
    dW: string;
    dS: string;
    eW: string;
    eS: string;
    id: string;
    learned: boolean;
    starred: boolean;
}

const S: Schema<I> = new Schema({
    owner: { type: Schema.Types.ObjectId, required: true },
    dW: { type: String, required: true },
    dS: { type: String, required: true },
    eW: { type: String, required: true },
    eS: { type: String, required: true },
    id: { type: String, requered: true },
    learned: { type: Boolean, required: true },
    starred: { type: Boolean, required: true }
})

const WordModel = model<I>("Words", S)

export default WordModel