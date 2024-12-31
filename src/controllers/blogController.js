import pool from "../config/db.js";
import { ApiError } from "../middlewares/ApiError.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { uploadFileToS3 ,deleteFileFromS3} from "../middlewares/multeraws.js";
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
  const { title, content, tags, category,status} = req.body;
  const author_id = req.userId;

console.log("Body",req.body);


// if (req.file) {
  
// const file = req.file;
//   if (!file) {
//     return res.status(400).send('No file uploaded.');
//   }
//   const uniqueKey = `uploads/${Date.now()}_${file.originalname}`;
//   console.log(uniqueKey);
  

  const fileKey = await uploadFileToS3(req.file);
  // console.log("key",fileKey);
// }
  const featured_image =req.file
    ? fileKey
    : null;
  try {


        // Replace specific word/phrase (e.g., 'testing') with backlinks
        // let updatedContent = content;

        // backlinks.forEach(backlink => {
        //   const regex = new RegExp(`\\b${backlink.anchor_text}\\b`, 'g'); // Create regex to find the word
        //   const anchorTag = `<a href="${backlink.url}" target="_blank" rel="noopener noreferrer">${backlink.anchor_text}</a>`;
          
        //   // Replace all occurrences of the word with the anchor tag
        //   updatedContent = updatedContent.replace(regex, anchorTag);
        // });


    const tagsArray = tags.split(",").map(tag => tag.trim());
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
        return res.status(404).json({ message: 'Blog not found' });
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
      console.error('Error fetching blog:', error);
      res.status(500).json({ message: 'Failed to fetch blog' });
    }
  });
//   try {

//     const blog = await getBlogByIdService(req.params.id);
//     if (!blog) {
//       throw new ApiError(404, "blog Not found");
//     }
//     handleResponse(res, 200, "Blog fetch Successfully", blog);
//   } catch (error) {
//     next(error);
//   }
// });

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
    await client.query('BEGIN');

    const currentBlog = await client.query(
      'SELECT featured_image FROM blogs WHERE id = $1',
      [id]
    );

    const oldImagePath = currentBlog.rows[0]?.featured_image;
    console.log("img path",oldImagePath);
    

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
        const regex = new RegExp(`\\b${backlink.anchor_text}\\b`, 'g'); // Match exact words
        const anchorTag = `<a href="${backlink.url}" target="_blank" rel="noopener noreferrer">${backlink.anchor_text}</a>`;
        updatedContent = updatedContent.replace(regex, anchorTag);
      });
    } else {
      console.log("Backlinks is not an array or is missing");
    }
    const tags = req.body.tags ? req.body.tags.split(',') : [];

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
        await pool.query(backlinkQuery, [id, backlink.url, backlink.anchor_text]);
      }
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      blog: updatedBlog.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating blog:', error);
    res.status(500).json({ success: false, message: 'Failed to update blog', error: error.message });
  } finally {
    client.release();
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
