import express from 'express'
import { createBlog, getAllBlog, getBlogById, updateBlogById } from '../controllers/blogController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/multeraws.js';

const router = express.Router();
import pool from '../config/db.js';




// router.post("/",verifyToken,upload.single('image'),createBlog)
router.post("/",upload,createBlog)
router.get("/",getAllBlog)
router.get("/:id", getBlogById)
router.put("/:id",upload,updateBlogById)

export default router;