const mongoose = require("mongoose");
const validator = require("validator");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "A project must have a Title"],
  },
  description: {
    type: String,
    required: [true, "A project must have a Description"],
  },
  deadline: {
    type: Date,
    required: [true, "A project must have a Deadline"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
});

projectSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name email",
  });

  next();
});

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
