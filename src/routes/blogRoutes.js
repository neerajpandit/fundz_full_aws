import express from "express";
import {
  createBlog,
  deleteBacklink,
  deleteBlogById,
  getAllBlog,
  getBlogById,
  getBlogBySlug,
  updateBlogById,
} from "../controllers/blogController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multeraws.js";

const router = express.Router();

router.post("/",verifyToken,upload, createBlog);
router.get("/", getAllBlog);
router.get("/:id", getBlogById);
router.get('/slug/:slug',getBlogBySlug);
router.put("/:id",verifyToken,  upload, updateBlogById);
router.delete('/backlinks/:blogId/:backlinkId',verifyToken, deleteBacklink);
router.delete('/:id', verifyToken,deleteBlogById);
export default router;
