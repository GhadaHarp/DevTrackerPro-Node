const express = require("express");
const moongose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const morgan = require("morgan");
const socketIO = require("socket.io");
const cors = require("cors");
const globalErrorHandler = require("./controllers/errorController");

dotenv.config({ path: "./config.env" });

const app = express();
const server = http.createServer(app);

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

moongose
  .connect(DB)
  .then((con) => {
    console.log("✅ MongoDB connected successfully!");
  })
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

// Handle Undefined Routes
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port :${PORT}`);
});
