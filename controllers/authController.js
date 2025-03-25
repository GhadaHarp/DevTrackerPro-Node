const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const { promisify } = require("util");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  const token = signToken(newUser._id);
  res.status(201).json({
    status: "success",
    token,
    data: {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    },
  });
});
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) CHECK IF EMAIL AND PASSWORD ARE SENT WITH THE REQUEST
  if (!email || !password) {
    return next(new AppError("Please provide your email and password", 400));
  }
  // 2)CHECK IF USER EXISTS AND PASSWORD IS CORRECT
  // since i hide the password from showing in the result i have to make visible here again
  // bc i need it to compare
  const user = await User.findOne({ email }).select("+password");
  const correct = user && (await user.correctPassword(password, user.password));
  if (!user || !correct) {
    return next(new AppError("incorrect email or password", 401));
  }
  // 3) IF EVERYTHING IS OK SENd THE TOKEN TO THE CLIENT
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
  });
});

const protect = catchAsync(async (req, res, next) => {
  // 1) GETTING THE TOKEN AND CHECK IF IT IS THERE
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) VERIFICATION OF TOKEN
  // decoded is the payload that contains the user _id as id
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  // we can add properties to the req so it can be available in the next middleware
  // so if we want to use RESTRICTTO we have to use PROTECT before it
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

module.exports = { signup, login, protect };
