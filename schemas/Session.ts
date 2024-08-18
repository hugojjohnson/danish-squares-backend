import { Schema, Document, model, ObjectId } from "mongoose";

interface I extends Document {
    user: ObjectId;
    active: boolean;
    startedAt: Date;
}

const S: Schema<I> = new Schema({
    user: { type: Schema.Types.ObjectId, required: true },
    active: { type: Boolean, default: true },
    startedAt: { type: Date, default: () => Date.now() },
})

const SessionModel = model<I>("Sessions", S)

export default SessionModel