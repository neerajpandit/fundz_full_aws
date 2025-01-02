import express from "express";
import {
  createFundHouse,
  createFundScheme,
  getAllMutualFund,
  getMutualFundData,
} from "../controllers/mutualfundController.js";
import { upload } from "../middlewares/multeraws.js";

const router = express.Router();

router.get("/:schemeCode", getMutualFundData);
router.get("/", getAllMutualFund);
router.post("/", upload, createFundHouse);
router.post("/scheme", createFundScheme);

export default router;
