import { Schema, Document, model } from "mongoose"

interface I extends Document {
    username: string;
    hash: String;
}

const S: Schema<I> = new Schema({
    username: { type: String, required: true },
    hash: String,
})

const UserModel = model<I>("Users", S)

export default UserModel