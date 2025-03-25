const Task = require("../models/taskModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");

const catchAsync = require("../utils/catchAsync");

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({
    status: "success",
    length: users.length,
    data: {
      users,
    },
  });
});

const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("No user found with that id"), 404);
  }
  res.status(200).json({
    status: "success",
    data: user,
  });
});

const createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  res.status(201).send({
    status: "success",
    data: newUser,
  });
});
const updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(new AppError("No user found with that id"), 404);
  }
  res.status(200).json({
    status: "success",
    data: user,
  });
});
const deleteUser = catchAsync(async (req, res, next) => {
  console.log(req.user);
  if (
    (!req.user || req.user._id.toString() !== req.params.id) &&
    req.user.role !== "admin"
  ) {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }

  const user = await User.findByIdAndDelete(req.params.id);
  await Task.deleteMany({ user: req.params.id });

  if (!user) {
    return next(new AppError("No user found with that id", 404));
  }

  res.status(200).json({
    status: "success",
    message: "User deleted successfully",
    data: null,
  });
});

module.exports = { getAllUsers, getUser, updateUser, createUser, deleteUser };
