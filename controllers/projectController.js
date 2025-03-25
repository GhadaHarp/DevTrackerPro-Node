const Project = require("../models/projectModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");

const createProject = catchAsync(async (req, res, next) => {
  console.log(req.user);
  const project = await Project.create({
    title: req.body.title,
    description: req.body.description,
    deadline: req.body.deadline,
    user: req.user._id,
  });
  await User.findByIdAndUpdate(req.user._id, {
    $push: { projects: project._id },
  });
  res.status(201).send({
    status: "success",
    data: project,
  });
});

const getAllProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({ user: req.user._id }).populate({
    path: "tasks",
    select: "title status priority description",
  });
  res.status(201).send({
    status: "success",
    results: projects.length,
    data: projects,
  });
});
const getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id).populate({
    path: "tasks",
    select: "title status priority description",
  });
  res.status(201).send({
    status: "success",
    data: project,
  });
});
const updateProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError("please provide the project id", 400));
  }
  const project = await Project.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!project) {
    return next(new AppError("No Project found with that id"), 404);
  }
  res.status(200).json({
    status: "success",
    data: project,
  });
});
const deleteProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError("please provide the project id", 400));
  }
  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError("No Project found with that id"), 404);
  }
  if (req.user._id.toString() !== project.user._id.toString()) {
    return next(
      new AppError("You are not authorized to delete this task", 403)
    );
  }
  await Project.findByIdAndDelete(id);
  const userUpdateResult = await User.updateMany(
    { projects: id },
    { $pull: { projects: id } }
  );
  if (userUpdateResult.modifiedCount === 0) {
    return next(new AppError("Project not found in user's project array", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Project deleted successfully",
    data: null,
  });
});
module.exports = {
  createProject,
  getAllProjects,
  updateProject,
  deleteProject,
  getProject,
};
