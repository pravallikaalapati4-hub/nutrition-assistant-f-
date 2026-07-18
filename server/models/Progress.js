const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: Date, default: Date.now },
    weightKg: { type: Number },
    caloriesConsumed: { type: Number },
    proteinConsumed: { type: Number },
    adherenceScore: { type: Number, min: 0, max: 100 },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);
