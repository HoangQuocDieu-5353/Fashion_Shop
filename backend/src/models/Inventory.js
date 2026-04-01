const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    variant: { // Đổi tên từ 'product' thành 'variant'
        type: mongoose.Types.ObjectId,
        ref: 'ProductVariant', 
        required: true,
        unique: true // Đảm bảo 1 SKU chỉ có đúng 1 bản ghi trong kho
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    reserved: {
        type: Number,
        default: 0,
        min: 0
    }, 
    stockCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema);