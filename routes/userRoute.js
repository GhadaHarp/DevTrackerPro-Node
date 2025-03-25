const express = require("express");
const { signup, login, protect } = require("../controllers/authController");
const router = express.Router();

const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.route("/").get(protect, getAllUsers).post(protect, createUser);
router
  .route("/:id")
  .get(getUser)
  // .get(protect, restrictTo("admin"), getUser)
  .patch(updateUser)
  .delete(protect, deleteUser);
router.route("/signup").post(signup);
router.route("/login").post(login);

module.exports = router;
