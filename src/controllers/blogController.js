import { ApiError } from "../middlewares/ApiError.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { uploadFileToS3 } from "../middlewares/multeraws.js";
import { handleResponse } from "../middlewares/responseHandler.js";
import {
  createBlogService,
  getAllBlogService,
  getBlogByIdService,
  likeBlogService,
  updateBlogService,
} from "../models/blogModel.js";

import AWS from 'aws-sdk';
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});



export const createBlog = asyncHandler(async (req, res, next) => {
  const { title, content, tags, category } = req.body;
  const author_id = req.userId;


  const fileKey = await uploadFileToS3(req.file);
  // console.log("key",fileKey);

  const featured_image =req.file
    ? fileKey
    : null;
  try {
    const blog = await createBlogService(
      title,
      content,
      author_id,
      tags,
      category,
      featured_image
    );
    if (!blog) {
      throw new ApiError(404, "blog Not created");
    }
    handleResponse(res, 201, "Blog Created Successfully", blog);
  } catch (error) {
    next(error);
  }
});

export const getAllBlog = asyncHandler(async (req, res, next) => {
  try {
    const blog = await getAllBlogService();
    if (!blog) {
      throw new ApiError(404, "blogs Not flound");
    }
    handleResponse(res, 200, "Blog fetched successfully", blog);
  } catch (error) {
    next(error);
  }
});

export const getBlogById = asyncHandler(async (req, res, next) => {
  try {
    const blog = await getBlogByIdService(req.params.id);
    if (!blog) {
      throw new ApiError(404, "blog Not found");
    }
    handleResponse(res, 200, "Blog fetch Successfully", blog);
  } catch (error) {
    next(error);
  }
});

export const updateBlogById = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Blog ID from route parameter
  const updateFields = req.body; // Fields to update from request body

  try {
    const updatedBlog = await updateBlogService(id, updateFields);

    res.status(200).json({
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    next(error);
  }
});

export const likeBlogById = asyncHandler(async (req, res, next) => {
    const { id } = req.params; // Blog ID from route parameter

  try {
    const likedBlog = await likeBlogService(id);

    res.status(200).json({
      message: 'Blog liked successfully',
      blog: likedBlog,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || 'Error liking blog',
    });
  }
});
