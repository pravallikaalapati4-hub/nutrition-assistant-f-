const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'serving' },
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 },
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
    items: [foodItemSchema],
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dailyCalorieTarget: { type: Number, default: 2100 },
    meals: {
      type: [mealSchema],
      default: () => ([
        { type: 'breakfast', items: [] },
        { type: 'lunch', items: [] },
        { type: 'dinner', items: [] },
        { type: 'snack', items: [] },
      ]),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MealPlan', mealPlanSchema);
