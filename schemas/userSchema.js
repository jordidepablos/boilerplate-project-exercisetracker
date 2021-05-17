const mongoose = require('mongoose');
const { Schema } = mongoose;
const { exerciseSchema } = require('./exerciseSchema');

const userSchema = new Schema({
    username: { type: String, required: true },
    exercises: { type: [{ type: Schema.Types.ObjectId, ref: exerciseSchema }], required: false }
});

module.exports = {
    userSchema: userSchema,
    User: mongoose.model("User", userSchema)
};