const express = require("express");
const {
  createProject,
  getAllProjects,
  updateProject,
  deleteProject,
  getProject,
} = require("../controllers/projectController");
const { protect } = require("../controllers/authController");
const taskRoute = require("./taskRoute");
const router = express.Router();

router.use("/:projectId/tasks", taskRoute);
router.route("/").post(protect, createProject).get(protect, getAllProjects);
router
  .route("/:id")
  .get(protect, getProject)
  .patch(protect, updateProject)
  .delete(protect, deleteProject);
module.exports = router;
