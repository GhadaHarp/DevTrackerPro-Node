const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const morgan = require("morgan");
const socketIO = require("socket.io");
const cors = require("cors");
const globalErrorHandler = require("./controllers/errorController");
const { checkTaskDueDates } = require("./controllers/projectController");

dotenv.config({ path: "./config.env" });

const app = express();
const server = http.createServer(app);

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

let io = socketIO(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

module.exports = { app, io };

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:4200",
    methods: "GET,POST,PUT,DELETE,PATCH",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// Routers
const taskRouter = require("./routes/taskRoute");
const userRouter = require("./routes/userRoute");
const projectRouter = require("./routes/projectRoute");
const AppError = require("./utils/appError");

app.use("/tasks", taskRouter);
app.use("/users", userRouter);
app.use("/projects", projectRouter);

checkTaskDueDates(io);

setInterval(() => {
  checkTaskDueDates(io);
}, 60 * 1000);

app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  socket.on("taskReminder", (data) => {
    console.log("📢 Emitting 'taskReminder' event with data:", data);
    io.emit("taskReminder", data);
  });

  socket.on("disconnect", () => {
    console.log("⚠️ Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port :${PORT}`);
});
