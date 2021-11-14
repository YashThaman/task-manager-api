const mongoose =require('mongoose')
const validator= require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')
//Middleware (runs before object creation)
const userSchema = new mongoose.Schema({  // define model
    name: {
        type: String,
        required: true,       // we can define in model that the feild is required
        trim:true
    },
    email:{
        type: String,
        unique: true,
        required: true,           // data santization
        trim: true,
        lowercase: true,
        validate(value){          //data validation
            if(!validator.isEmail(value)){
                throw new Error('Inavalid EMail')
            }
        }
    },
    password:{
        type:String,
        required:true,
        minlength: 7,
        trim: true,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot have "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value){
            if(value<0){
                throw new Error('Age cannot be nagative')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, 'thisismynewcourse')

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.statics.findByCredentials =async (email,password)=>{

    const user = await User.findOne({email})

    if( !user){
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error('Unable to Login')
    }
    return user
}

// Hash plain text for password
userSchema.pre('save',async function (next){   // pre means before the saving of user
    const user = this    // this shows the individual user about to be saved
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()    //it help to understand  when the process is ended
})

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User',userSchema)


module.exports = User