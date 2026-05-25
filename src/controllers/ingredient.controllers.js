import * as ingredientService from '../services/ingredient.services.js';


const getIngredients = async (req, res) => {
  try {
    const data = await ingredientService.getAllIngredients();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    await ingredientService.deleteIngredient(id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export{ getIngredients, removeIngredient };