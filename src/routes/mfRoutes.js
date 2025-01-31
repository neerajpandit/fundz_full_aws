import express from "express";
import {
  createFundHouse,
  createFundScheme,
  getAllMutualFund,
  getFundHouse,
  getMutualFundData,
  updateFundScheme,
  deleteFundScheme,
} from "../controllers/mutualfundController.js";
import { upload } from "../middlewares/multeraws.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/fund-house",getFundHouse)
router.get("/", getAllMutualFund);
router.get("/:schemeCode", getMutualFundData);


router.post("/",verifyToken, upload, createFundHouse);
router.post("/scheme",verifyToken, createFundScheme); 
router.put("/:id",verifyToken, updateFundScheme);
router.delete("/:id",verifyToken, deleteFundScheme);

export default router;
