const Project = require("../models/projectModel");
const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const checkTaskDueDates = async () => {
  try {
    console.log("🔍 Checking task deadlines with reminders...");

    const now = new Date();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    const twelveHours = 12 * oneHour;
    const twentyFourHours = 24 * oneHour;

    // Fetch tasks with reminders enabled
    const tasksWithReminders = await Task.find({
      timeLeft: { $in: [24, 12, 1] },
      reminderEnabled: true, // Only fetch tasks with reminders enabled
    }).populate("user");

    if (tasksWithReminders.length === 0) {
      console.log("✅ No tasks with upcoming reminders.");
      return;
    }

    tasksWithReminders.forEach((task) => {
      const deadline = new Date(task.deadline);
      const timeLeftMs = deadline - now;
      const timeLeftHours = Math.floor(timeLeftMs / oneHour); // Convert to hours

      // If `timeLeft` is 24h, 12h, or 1h and the user set a reminder
      if ([24, 12, 1].includes(timeLeftHours)) {
        const eventMap = {
          24: "taskDueIn24h",
          12: "taskDueIn12h",
          1: "taskDueIn1h",
        };
        const event = eventMap[timeLeftHours];

        console.log(
          `⚠️ Task "${task.title}" is due in ${timeLeftHours} hours for ${task.user.name}`
        );

        io.emit(event, {
          title: task.title,
          dueDate: task.deadline,
          userId: task.user._id.toString(),
          timeLeft: timeLeftHours,
        });

        console.log(`📢 Emitting '${event}' event with data:`, {
          title: task.title,
          dueDate: task.deadline,
          timeLeft: timeLeftHours,
        });
      }
    });
  } catch (error) {
    console.error("❌ Error checking task due dates:", error);
  }
};

const getAllTasks = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Task.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tasks = await Task.find(features.query);
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
  const { title, description, status, priority, projectId, deadline } =
    req.body;
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
    deadline,
    user: req.user._id,
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
  const { deadline, reminderActive } = req.body;

  let updatedFields = req.body;

  if (deadline) {
    updatedFields.reminderTimes = [1, 12, 24];
  }

  const task = await Task.findByIdAndUpdate(id, updatedFields, {
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
const updateTaskTime = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const time = Number(req.body.time);
  if (!time && time !== 0) {
    return next(
      new AppError("Plesae provide the time spent on the task,", 400)
    );
  }
  const task = await Task.findByIdAndUpdate(
    id,
    { timeSpent: time },
    { new: true, runValidators: true }
  );
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
  const task = await Task.findById(id);
  if (!task) {
    return next(new AppError("No task found with that id", 404));
  }
  console.log(task);
  if (req.user._id.toString() !== task.project.user._id.toString()) {
    return next(
      new AppError("You are not authorized to delete this task", 403)
    );
  }

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
  updateTaskTime,
};
