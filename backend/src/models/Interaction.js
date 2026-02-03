import mongoose from 'mongoose';

const schema = new mongoose.Schema({
 storeId:String,
 sessionId:String,
 message:String,
 aiReply:String,
 createdAt:{type:Date, default:Date.now}
});

export default mongoose.model('Interaction',schema);
