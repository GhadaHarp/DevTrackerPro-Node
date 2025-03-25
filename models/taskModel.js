const mongoose = require("mongoose");
const validator = require("validator");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "A Task must have a Title"],
  },
  description: {
    type: String,
    required: [true, "A Task must have a Description"],
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["not-started", "in-progress", "completed"],
    default: "not-started",
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
});
taskSchema.pre(/^find/, function (next) {
  this.populate({
    path: "project",
    select: "title deadline",
  });
  next();
});
const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
