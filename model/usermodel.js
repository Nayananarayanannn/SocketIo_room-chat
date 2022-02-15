const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/chatdb').then(()=>{
    console.log("connected db...")
}).catch((err)=>{
    console.log("not connected",err);
});
const Schema = mongoose.Schema;

const NewSchema = new Schema({
    username: String,
    room:String
});

const Userdata = mongoose.model('users', NewSchema);

module.exports = Userdata;