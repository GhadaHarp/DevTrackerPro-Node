const express = require("express");

const { protect } = require("../controllers/authController");
const {
  createTask,
  updateTask,
  deleteTask,
  getTask,
  getAllTasks,
  getProjectTasks,
} = require("../controllers/taskController");
const router = express.Router({ mergeParams: true });

router.route("/").post(protect, createTask).get(protect, getProjectTasks);
router
  .route("/:id")
  .patch(protect, updateTask)
  .delete(protect, deleteTask)
  .get(protect, getTask);
module.exports = router;
