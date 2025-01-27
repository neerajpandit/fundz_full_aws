import express from "express";
import {
  createBlog,
  deleteBacklink,
  getAllBlog,
  getBlogById,
  getBlogBySlug,
  updateBlogById,
} from "../controllers/blogController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multeraws.js";

const router = express.Router();

router.post("/",upload, createBlog);
router.get("/", getAllBlog);
router.get("/a/:id", getBlogById);
router.get('/:slug',getBlogBySlug);
router.put("/:id",  upload, updateBlogById);
router.delete('/backlinks/:blogId/:backlinkId', deleteBacklink);
export default router;
