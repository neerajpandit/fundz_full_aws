import express from "express";
import {
  createFundHouse,
  createFundScheme,
  getAllMutualFund,
  getFundHouse,
  getMutualFundData,
} from "../controllers/mutualfundController.js";
import { upload } from "../middlewares/multeraws.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/fund-house",getFundHouse)
router.get("/", getAllMutualFund);
router.get("/:schemeCode", getMutualFundData);


router.post("/", upload, createFundHouse);
router.post("/scheme", createFundScheme);


export default router;
