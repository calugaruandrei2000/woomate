import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
 userId:String,
 storeUrl:String,
 platform:String,
 token:String,
 plan:{type:String, default:'trial'}
});

export default mongoose.model('Store',storeSchema);
