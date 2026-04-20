const express = require('express');
const router = express.Router();
const pokemonController = require('../controllers/pokemonController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', pokemonController.getAll);
router.get('/stats', pokemonController.getStats);
router.get('/:id', pokemonController.getOne);
router.post('/', pokemonController.create);
router.put('/:id', pokemonController.update);
router.delete('/:id', pokemonController.delete);

module.exports = router;
