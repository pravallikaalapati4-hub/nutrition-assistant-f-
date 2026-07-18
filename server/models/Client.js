const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dietitian: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    targetCalories: { type: Number, default: 2100 },
    macroTargets: {
      proteinG: { type: Number, default: 130 },
      carbsG: { type: Number, default: 230 },
      fatG: { type: Number, default: 70 },
    },
    dietaryPreferences: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
