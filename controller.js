const mongoose = require('mongoose')

//model
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: {
        type: String,
        default: 'visitor'
    }
}, {
    collaction:'users'
})

const UserModel = mongoose.model("users", UserSchema)

module.exports = UserModel