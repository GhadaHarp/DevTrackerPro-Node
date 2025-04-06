const Project = require("../models/projectModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const Task = require("../models/taskModel");
const { io } = require("../app");

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

const checkTaskDueDates = async (io) => {
  try {
    console.log("🔍 Checking task deadlines...");

    const now = new Date();
    const oneHourMs = 60 * 60 * 1000;

    const tasksWithReminders = await Task.find({ reminderActive: true });

    if (!tasksWithReminders.length) {
      console.log("✅ No tasks with active reminders.");
      return;
    }

    for (const task of tasksWithReminders) {
      const deadline = new Date(task.deadline);
      const timeLeftMs = deadline.getTime() - now.getTime();

      for (const hourMark of task.reminderTimes) {
        const targetMs = hourMark * oneHourMs;

        // Tolerance of 30 seconds
        const isExactMatch =
          timeLeftMs >= targetMs - 30_000 && timeLeftMs <= targetMs + 30_000;

        if (isExactMatch) {
          console.log(
            `📢 Sending reminder: "${task.title}" is due in ${hourMark} hours`
          );

          io.emit("taskReminder", {
            title: task.title,
            dueDate: task.deadline,
            timeLeft: hourMark,
          });

          // Remove this hour from the list so it doesn't trigger again
          await Task.findByIdAndUpdate(task._id, {
            $pull: { reminderTimes: hourMark },
          });
        }
      }

      // If task is past due, disable future reminders
      if (timeLeftMs <= 0) {
        await Task.findByIdAndUpdate(task._id, {
          reminderActive: false,
          reminderTimes: [],
        });
        console.log(`🚫 Reminder disabled for task "${task.title}"`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking task due dates:", error);
  }
};

const getAllProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({ user: req.user._id }).populate({
    path: "tasks",
    select:
      "title status priority description deadline timeSpent timeLeft reminderActive reminderTimes",
  });
  // checkTaskDueDates(io);

  // const INTERVAL_MS = 60 * 1000 * 10; // 1 minute

  // setInterval(() => {
  //   checkTaskDueDates();
  // }, INTERVAL_MS);

  res.status(201).send({
    status: "success",
    results: projects.length,
    data: projects,
  });
});
const getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id).populate({
    path: "tasks",
    select: "title status priority description deadline user",
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
    return next(new AppError("Please provide the project ID", 400));
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError("No Project found with that ID", 404));
  }

  if (req.user._id.toString() !== project.user._id.toString()) {
    return next(
      new AppError("You are not authorized to delete this project", 403)
    );
  }

  await User.updateMany({ projects: id }, { $pull: { projects: id } });

  await Project.findByIdAndDelete(id);

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
  checkTaskDueDates,
};
