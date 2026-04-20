const mongoose = require('mongoose');

const PokemonSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pokemonId: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  category: {
    type: String,
    enum: ['regular', 'shiny', 'xxl', 'hundo', 'littleleague', 'greatleague', 'ultraleague', 'masterleague', 'dynamax', 'gigantamax'],
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PokemonSchema.index({ userId: 1, pokemonId: 1, category: 1 });

module.exports = mongoose.model('Pokemon', PokemonSchema);
