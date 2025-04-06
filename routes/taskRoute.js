const express = require("express");

const { protect } = require("../controllers/authController");
const {
  createTask,
  updateTask,
  deleteTask,
  getTask,
  getAllTasks,
  getProjectTasks,
  updateTaskTime,
} = require("../controllers/taskController");
const router = express.Router({ mergeParams: true });

router.route("/").post(protect, createTask).get(protect, getAllTasks);
router
  .route("/:id")
  .patch(protect, updateTask)
  .delete(protect, deleteTask)
  .get(protect, getTask);
router.route("/:id/time").patch(protect, updateTaskTime);
module.exports = router;
