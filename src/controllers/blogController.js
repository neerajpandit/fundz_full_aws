import pool from "../config/db.js";
import { ApiError } from "../middlewares/ApiError.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { uploadFileToS3, deleteFileFromS3 } from "../middlewares/multeraws.js";
import { handleResponse } from "../middlewares/responseHandler.js";
import {
  createBlogService,
  getAllBlogService,
  getBlogByIdService,
  likeBlogService,
  updateBlogService,
} from "../models/blogModel.js";

import AWS from "aws-sdk";
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const createBlog = asyncHandler(async (req, res, next) => {
  const { title, content, tags, category, status } = req.body;
  const author_id = req.userId;

  console.log("Body", req.body);

  const fileKey = await uploadFileToS3(req.file);
  // console.log("key",fileKey);
  // }
  const featured_image = req.file ? fileKey : null;
  try {
    const tagsArray = tags.split(",").map((tag) => tag.trim());
    const blog = await createBlogService(
      title,
      content,
      author_id,
      tagsArray,
      category,
      status,
      featured_image
    );
    if (!blog) {
      throw new ApiError(404, "blog Not created");
    }
    console.log(blog.id);

    // const blogId = blog.id;

    // Insert backlinks into the backlinks table
    // backlinks.forEach(async (backlink) => {
    //   const backlinkQuery = `
    //     INSERT INTO backlinks (blog_id, url, anchor_text)
    //     VALUES ($1, $2, $3)
    //   `;
    //   await pool.query(backlinkQuery, [blogId, backlink.url, backlink.anchor_text]);
    // });
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
  const blogId = req.params.id;
  // console.log("blof id",blogId);
  try {
    // Fetch the blog
    const blogQuery = `
        SELECT * FROM blogs WHERE id = $1
      `;
    const blogResult = await pool.query(blogQuery, [blogId]);

    if (blogResult.rows.length === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const blog = blogResult.rows[0];

    // Fetch the backlinks for the blog
    const backlinksQuery = `
        SELECT * FROM backlinks WHERE blog_id = $1
      `;
    const backlinksResult = await pool.query(backlinksQuery, [blogId]);

    const backlinks = backlinksResult.rows;

    // Return the blog and backlinks in the response
    res.status(200).json({
      blog: {
        ...blog,
        backlinks: backlinks, // Attach the backlinks
      },
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ message: "Failed to fetch blog" });
  }
});

export const updateBlogById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, content, tags, category, status } = req.body;

  const featured_image = req.file ? req.file.path : null;
  const backlinks = req.body.backlinks ? JSON.parse(req.body.backlinks) : [];

  // console.log("Update request body", req.body);
  // console.log("Backlinks:", req.body.backlinks);
  // console.log("Uploaded tags", tags);

  const client = await pool.connect(); // Use a transaction for atomic operations

  try {
    await client.query("BEGIN");

    const currentBlog = await client.query(
      "SELECT featured_image FROM blogs WHERE id = $1",
      [id]
    );

    const oldImagePath = currentBlog.rows[0]?.featured_image;
    console.log("img path", oldImagePath);

    let featured_image = null;

    // If new image is uploaded, delete the old image from S3
    if (req.file) {
      // Delete the old image if it's available
      if (oldImagePath) {
        await deleteFileFromS3(oldImagePath);
      }

      // Upload the new image to S3 and get the URL
      const fileKey = await uploadFileToS3(req.file);
      featured_image = fileKey;
    }

    let updatedContent = content || ""; // Default to empty string if not provided
    const backlinks = req.body.backlinks ? JSON.parse(req.body.backlinks) : [];

    if (Array.isArray(backlinks)) {
      backlinks.forEach((backlink) => {
        const regex = new RegExp(`\\b${backlink.anchor_text}\\b`, "g"); // Match exact words
        const anchorTag = `<a href="${backlink.url}" target="_blank" rel="noopener noreferrer">${backlink.anchor_text}</a>`;
        updatedContent = updatedContent.replace(regex, anchorTag);
      });
    } else {
      console.log("Backlinks is not an array or is missing");
    }
    const tags = req.body.tags ? req.body.tags.split(",") : [];

    // Update the blog with modified content
    const updatedBlog = await client.query(
      `UPDATE blogs SET 
         title = COALESCE($1, title),
         content = COALESCE($2, content),
         tags = COALESCE($3, tags),
         category = COALESCE($4, category),
         status = COALESCE($5, status),
         featured_image = COALESCE($6, featured_image),
         updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [title, updatedContent, tags, category, status, featured_image, id]
    );

    // Insert new backlinks into the backlinks table
    if (Array.isArray(backlinks)) {
      for (const backlink of backlinks) {
        const backlinkQuery = `
          INSERT INTO backlinks (blog_id, url, anchor_text) 
          VALUES ($1, $2, $3)
        `;
        await pool.query(backlinkQuery, [
          id,
          backlink.url,
          backlink.anchor_text,
        ]);
      }
    }

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating blog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update blog",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

export const likeBlogById = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Blog ID from route parameter

  try {
    const likedBlog = await likeBlogService(id);

    res.status(200).json({
      message: "Blog liked successfully",
      blog: likedBlog,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Error liking blog",
    });
  }
});



export const deleteBacklink1 = async (req, res) => {
  const { id } = req.params;

  try {
    // Ensure the backlink ID is provided and valid
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid backlink ID.' });
    }

    // Query to delete the backlink
    const query = 'DELETE FROM backlinks WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    // Check if the backlink was found and deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Backlink not found.' });
    }

    res.status(200).json({
      message: 'Backlink deleted successfully.',
      deletedBacklink: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting backlink:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteBacklink = asyncHandler(async (req, res, next) => {
  const { blogId, backlinkId } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get the blog and its content
    const blogQuery = await client.query("SELECT content FROM blogs WHERE id = $1", [blogId]);
    if (blogQuery.rowCount === 0) {
      throw new Error("Blog not found");
    }

    let content = blogQuery.rows[0].content;

    // Get the backlink details to delete
    const backlinkQuery = await client.query("SELECT url, anchor_text FROM backlinks WHERE id = $1 AND blog_id = $2", [backlinkId, blogId]);
    if (backlinkQuery.rowCount === 0) {
      throw new Error("Backlink not found");
    }

    const { url, anchor_text } = backlinkQuery.rows[0];

    // Remove the backlink from the blog content
    const anchorTagRegex = new RegExp(`<a href="${url}".*?>${anchor_text}</a>`, "g");
    content = content.replace(anchorTagRegex, anchor_text);

    // Delete the backlink from the backlinks table
    await client.query("DELETE FROM backlinks WHERE id = $1", [backlinkId]);

    // Update the blog content
    await client.query(
      "UPDATE blogs SET content = $1, updated_at = NOW() WHERE id = $2",
      [content, blogId]
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Backlink deleted and blog updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting backlink:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete backlink",
      error: error.message,
    });
  } finally {
    client.release();
  }
});
