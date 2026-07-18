const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const MealPlan = require('../models/MealPlan');
const Client = require('../models/Client');
const { assertClientAccess } = require('./clientController');

// POST /api/mealplans
const createMealPlan = asyncHandler(async (req, res) => {
  const { client: clientId, title, startDate, endDate, dailyCalorieTarget, meals } = req.body;
  if (!clientId || !title || !startDate || !endDate) {
    throw new ApiError(400, 'client, title, startDate, and endDate are required');
  }

  const client = await Client.findById(clientId);
  if (!client) throw new ApiError(404, 'Client not found');
  assertClientAccess(req.user, client);

  const mealPlan = await MealPlan.create({
    client: client._id,
    title,
    startDate,
    endDate,
    dailyCalorieTarget: dailyCalorieTarget || client.targetCalories,
    meals,
  });

  res.status(201).json({ mealPlan });
});

// GET /api/mealplans?client=<id>&active=true
const getMealPlans = asyncHandler(async (req, res) => {
  const { client: clientId, active } = req.query;
  const query = {};

  if (clientId) {
    const client = await Client.findById(clientId);
    if (!client) throw new ApiError(404, 'Client not found');
    assertClientAccess(req.user, client);
    query.client = clientId;
  } else if (req.user.role !== 'admin') {
    // Non-admins must scope by a client they can access; find the ones
    // available to them so they never see other people's plans.
    const accessibleClients = await Client.find(
      req.user.role === 'user' ? { user: req.user._id } : { dietitian: req.user._id }
    ).select('_id');
    query.client = { $in: accessibleClients.map((c) => c._id) };
  }

  if (active === 'true') {
    const now = new Date();
    query.startDate = { $lte: now };
    query.endDate = { $gte: now };
  }

  const mealPlans = await MealPlan.find(query).sort('-createdAt');
  res.json({ mealPlans });
});

// GET /api/mealplans/:id
const getMealPlanById = asyncHandler(async (req, res) => {
  const mealPlan = await MealPlan.findById(req.params.id).populate('client');
  if (!mealPlan) throw new ApiError(404, 'Meal plan not found');
  assertClientAccess(req.user, mealPlan.client);
  res.json({ mealPlan });
});

// PUT /api/mealplans/:id
const updateMealPlan = asyncHandler(async (req, res) => {
  const mealPlan = await MealPlan.findById(req.params.id).populate('client');
  if (!mealPlan) throw new ApiError(404, 'Meal plan not found');
  assertClientAccess(req.user, mealPlan.client);

  const { title, startDate, endDate, dailyCalorieTarget, meals } = req.body;
  if (title !== undefined) mealPlan.title = title;
  if (startDate !== undefined) mealPlan.startDate = startDate;
  if (endDate !== undefined) mealPlan.endDate = endDate;
  if (dailyCalorieTarget !== undefined) mealPlan.dailyCalorieTarget = dailyCalorieTarget;
  if (meals !== undefined) mealPlan.meals = meals;

  await mealPlan.save();
  res.json({ mealPlan });
});

// DELETE /api/mealplans/:id
const deleteMealPlan = asyncHandler(async (req, res) => {
  const mealPlan = await MealPlan.findById(req.params.id).populate('client');
  if (!mealPlan) throw new ApiError(404, 'Meal plan not found');
  assertClientAccess(req.user, mealPlan.client);
  await mealPlan.deleteOne();
  res.json({ message: 'Meal plan deleted' });
});

module.exports = {
  createMealPlan,
  getMealPlans,
  getMealPlanById,
  updateMealPlan,
  deleteMealPlan,
};
