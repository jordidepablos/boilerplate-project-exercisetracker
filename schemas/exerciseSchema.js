const mongoose = require('mongoose');
const { Schema } = mongoose;
const { userSchema } = require('./userSchema');

const exerciseSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, userSchema },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true }
});

module.exports = {
    exerciseSchema: exerciseSchema,
    Exercise: mongoose.model("Exercise", exerciseSchema)
};