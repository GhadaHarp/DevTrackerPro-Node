const Project = require("../models/projectModel");
const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");

const getAllTasks = catchAsync(async (req, res, next) => {
  const userProjects = await Project.find({ user: req.user._id }).select("_id");
  const projectIds = userProjects.map((project) => project._id);

  const tasks = await Task.find({ project: { $in: projectIds } });
  console.log(tasks);

  res.status(200).send({
    status: "success",
    results: tasks.length,
    data: tasks,
  });
});

const getProjectTasks = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.projectId) {
    filter = { project: req.params.projectId };
  }
  const features = new APIFeatures(Task.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tasks = await Task.find(features.query);
  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: {
      tasks,
    },
  });
});

const getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return next(new AppError("No task found with that id"), 404);
  }
  res.status(200).json({
    status: "success",
    data: task,
  });
});

const createTask = catchAsync(async (req, res, next) => {
  const { title, description, status, priority, projectId } = req.body;
  if (!projectId) {
    return next(new AppError("A task must have a project id", 400));
  }
  console.log(projectId);
  const task = await Task.create({
    title,
    description,
    status,
    priority,
    project: projectId,
  });
  const modifiedProjectsResults = await Project.findByIdAndUpdate(projectId, {
    $push: { tasks: task._id },
  });
  console.log(modifiedProjectsResults);
  if (!modifiedProjectsResults) {
    return next(new AppError("No Project found with that id", 400));
  }
  res.status(201).json({
    status: "success",
    data: task,
  });
});
const updateTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const task = await Task.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!task) {
    return next(new AppError("No task found with that id"), 404);
  }
  res.status(200).json({
    status: "success",
    data: task,
  });
});
const deleteTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  // 1) Find the task
  const task = await Task.findById(id);
  // 2) Check if task exists
  if (!task) {
    return next(new AppError("No task found with that id", 404));
  }
  console.log(task);
  // 3) Check if the authenticated user owns the task or is an admin
  if (req.user._id.toString() !== task.project.user._id.toString()) {
    return next(
      new AppError("You are not authorized to delete this task", 403)
    );
  }

  // 4) Delete the task
  await Task.findByIdAndDelete(req.params.id);

  const modifiedProjectsResults = await Project.updateMany(
    { tasks: id },
    { $pull: { tasks: id } }
  );
  if (modifiedProjectsResults.modifiedCount === 0) {
    return next(new AppError("Task not found in user's project array", 404));
  }
  res.status(200).json({
    status: "success",
    message: "Task deleted successfully",
    data: null,
  });
});
module.exports = {
  createTask,
  updateTask,
  deleteTask,
  getTask,
  getAllTasks,
  getProjectTasks,
};
