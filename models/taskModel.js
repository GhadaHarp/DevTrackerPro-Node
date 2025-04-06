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
  deadline: {
    type: Date,
    required: [true, "A task must have a Deadline"],
  },
  timeSpent: { type: Number, default: 0 },
  reminderActive: { type: Boolean, default: false },
  reminderTimes: [{ type: Number }],
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});
taskSchema.pre(/^find/, function (next) {
  this.populate({
    path: "project",
    select: "title deadline",
  }).populate({
    path: "user",
    select: "name email",
  });
  next();
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
