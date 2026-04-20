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
    enum: ['shiny', 'regular', 'xxl'],
    required: true
  },
  level: {
    type: Number,
    min: 1,
    max: 50,
    default: null
  },
  iv: {
    type: Number,
    min: 0,
    max: 100,
    default: null
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
