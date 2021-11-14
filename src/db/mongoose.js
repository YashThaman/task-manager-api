const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URL, {  // connect to database
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})