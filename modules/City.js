const mongoose = require("mongoose");

const CitySchema = new mongoose.Schema({
  name: String,
  region: String,
  latitude: Number,
  longitude: Number,
  population: Number,
});

module.exports = mongoose.model("City", CitySchema);