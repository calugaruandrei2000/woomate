import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
 storeId:String,
 orderId:String,
 total:Number,
 aiGenerated:Boolean,
 createdAt:{type:Date, default:Date.now}
});

export default mongoose.model('Sale',saleSchema);
