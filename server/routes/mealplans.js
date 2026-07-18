const express = require('express');
const {
  createMealPlan,
  getMealPlans,
  getMealPlanById,
  updateMealPlan,
  deleteMealPlan,
} = require('../controllers/mealPlanController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createMealPlan);
router.get('/', getMealPlans);
router.get('/:id', getMealPlanById);
router.put('/:id', updateMealPlan);
router.delete('/:id', deleteMealPlan);

module.exports = router;
