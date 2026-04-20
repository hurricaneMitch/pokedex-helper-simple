const Pokemon = require('../models/Pokemon');

exports.getAll = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { userId: req.userId };

    if (category) {
      filter.category = category;
    }

    const pokemon = await Pokemon.find(filter).sort({ createdAt: -1 });
    res.json(pokemon);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const pokemon = await Pokemon.findOne({ _id: req.params.id, userId: req.userId });

    if (!pokemon) {
      return res.status(404).json({ message: 'Pokemon not found' });
    }

    res.json(pokemon);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { pokemonId, name, image, category, notes } = req.body;

    if (!pokemonId || !name || !category) {
      return res.status(400).json({ message: 'pokemonId, name, and category are required' });
    }

    const VALID_CATEGORIES = ['regular', 'shiny', 'xxl', 'hundo', 'littleleague', 'greatleague', 'ultraleague', 'masterleague', 'dynamax', 'gigantamax'];
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const pokemon = new Pokemon({
      userId: req.userId,
      pokemonId,
      name,
      image: image || null,
      category,
      notes: notes || ''
    });

    await pokemon.save();
    res.status(201).json(pokemon);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { pokemonId, name, image, category, notes } = req.body;
    const updateData = {};

    if (pokemonId !== undefined) updateData.pokemonId = pokemonId;
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    if (category !== undefined) updateData.category = category;
    if (notes !== undefined) updateData.notes = notes;

    updateData.updatedAt = Date.now();

    const pokemon = await Pokemon.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    );

    if (!pokemon) {
      return res.status(404).json({ message: 'Pokemon not found' });
    }

    res.json(pokemon);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const pokemon = await Pokemon.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!pokemon) {
      return res.status(404).json({ message: 'Pokemon not found' });
    }

    res.json({ message: 'Pokemon deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await Pokemon.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      regular: 0,
      shiny: 0,
      xxl: 0,
      hundo: 0,
      littleleague: 0,
      greatleague: 0,
      ultraleague: 0,
      masterleague: 0,
      dynamax: 0,
      gigantamax: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
