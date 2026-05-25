import express from 'express';
import { getIngredients, removeIngredient } from '../controllers/ingredient.controllers.js';

const router = express.Router();

router.get('/', getIngredients);
router.delete('/:id', removeIngredient);

export default router;