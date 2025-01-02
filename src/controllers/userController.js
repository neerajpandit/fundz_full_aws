import pool from "../config/db.js";
import { ApiError } from "../middlewares/ApiError.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { accessToken, refreshToken } from "../middlewares/authMiddleware.js";
import { handleResponse } from "../middlewares/responseHandler.js";
import {
  createUserService,
  deleteUserService,
  getAllUsersService,
  getUserByIdService,
  loginUserService,
  logoutUserService,
  updateUserService,
} from "../models/userModel.js";

//req body
// check validity
//create user

export const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  try {
    const newUser = await createUserService(name, email, password, role);
    handleResponse(res, 201, "User created successfully", newUser);
  } catch (err) {
    next(err);
  }
});

//check req
//validate req
//find user by email from db
//compare hash passwored
//generate token
//check role
export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const userDetails = await loginUserService(email, password);
  if (!userDetails) {
    throw new ApiError(404, "user Not found");
  }
  console.log(userDetails.id);

  const access_token = await accessToken(
    userDetails.id,
    userDetails.email,
    userDetails.role
  );
  const refresh_token = await refreshToken(userDetails.id);

  const calculateExpiration = (expTime) => {
    const now = new Date();
    const duration = parseInt(expTime.slice(0, -1)); // Extract numeric part
    const unit = expTime.slice(-1); // Extract the unit (d, h, m)

    switch (unit) {
      case "d":
        now.setDate(now.getDate() + duration);
        break;
      case "h":
        now.setHours(now.getHours() + duration);
        break;
      case "m":
        now.setMinutes(now.getMinutes() + duration);
        break;
      default:
        throw new Error(
          "Invalid exp_time format. Use d (days), h (hours), or m (minutes)."
        );
    }

    return now;
  };
  const exp_refresh = calculateExpiration(process.env.REFRESH_TOKEN_EXPIRE);
  await pool.query(
    `UPDATE users 
     SET refresh_token = $1, refresh_token_expires_at = $2 
     WHERE id = $3 
     RETURNING *`,
    [refresh_token, exp_refresh, userDetails.id]
  );

  res.cookie("accessToken", access_token, {
    httpOnly: true, // Secure and only accessible via HTTP
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    maxAge: 1 * 24 * 60 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  res.set({
    accessToken: access_token,
    refreshToken: refresh_token,
  });

  // Send tokens in the response as well
  return res.status(200).json({
    message: "Login successful.",
    userDetails,
    access_token,
    refresh_token,
  });
});

export const logoutUser = asyncHandler(async (req, res, next) => {
  try {
    console.log("logout", req.userId);

    // Perform any required actions for logout, such as updating the user session in the database
    const user = await logoutUserService(req.userId);
    // console.log(user);

    if (!user) return handleResponse(res, 404, "User Not Found");

    // Clear cookies
    const options = {
      httpOnly: true,
      secure: true, // Ensure this is used in production with HTTPS
      sameSite: "strict", // Helps mitigate CSRF
    };

    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);

    // Optionally clear authorization headers
    res.setHeader("Authorization", "");

    return res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    next(error); // Pass the error to the global error handler
  }
});

export const getAllUsers = asyncHandler(async (req, res, next) => {
  try {
    const users = await getAllUsersService();
    handleResponse(res, 200, "Users fetched successfully", users);
  } catch (err) {
    next(err);
  }
});

export const getUserById = asyncHandler(async (req, res, next) => {
  try {
    const user = await getUserByIdService(req.params.id);
    if (!user) return handleResponse(res, 404, "User not found");

    handleResponse(res, 200, "User fetched successfully", user);
  } catch (err) {
    next(err);
  }
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;
  try {
    const updatedUser = await updateUserService(req.params.id, name, email);
    if (!updatedUser) return handleResponse(res, 404, "User not found");
    handleResponse(res, 200, "User updated successfully", updatedUser);
  } catch (err) {
    next(err);
  }
});

export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await deleteUserService(req.params.id);
    if (!deletedUser) return handleResponse(res, 404, "User not found");
    handleResponse(res, 200, "User deleted successfully", deleteUser);
  } catch (err) {
    next(err);
  }
};
