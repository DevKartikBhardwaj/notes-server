const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema(
  {
    belongsTo: {
      type: String,
      require: true,
    },
    title: {
      type: String,
      require: true,
    },
    description: {
      type: String,
      require: true,
    },
    tag: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("note", notesSchema);
