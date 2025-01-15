import pool from "../config/db.js";
import { ApiError } from "../middlewares/ApiError.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { uploadFileToS3 } from "../middlewares/multeraws.js";
import { handleResponse } from "../middlewares/responseHandler.js";
import axios from "axios";
import {
  createMutualFundService,
  createMutualSchemeService,
} from "../models/mfModel.js";

export const createFundScheme = asyncHandler(async (req, res, next) => {
  const { scheme_code,aum, about, status, fundhouse_id } = req.body;
  // console.log("SCHEME",req.body);

  // const schemeCode = "127042"

  const url = `https://api.mfapi.in/mf/${scheme_code}`;
  const response = await axios.get(url);

  if (!response.data || !response.data.data) {
    throw new Error("No data found for the provided scheme code");
  }
  // console.log("SchemeName",response.data.meta.scheme_name);
  const scheme_name = response.data.meta.scheme_name;

  // const fileKey = await uploadFileToS3(req.file);

  //   const mfLogo =req.file
  //     ? fileKey
  //     : null;

  try {
    const mf = await createMutualSchemeService(
      scheme_code,
      scheme_name,
      aum,
      about,
      status,
      fundhouse_id
    );
    if (!mf) {
      throw new ApiError("Find Error in create MF");
    }
    handleResponse(res, 201, "MF Created Successfully", mf);
  } catch (error) {
    next(error);
  }
});

export const createFundHouse = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  // const schemeCode = "127042"

  const fileKey = await uploadFileToS3(req.file);

  const mfLogo = req.file ? fileKey : null;

  try {
    const mf = await createMutualFundService(name, mfLogo);
    if (!mf) {
      throw new ApiError("Find Error in create MF");
    }
    handleResponse(res, 201, "MF House Created Successfully", mf);
  } catch (error) {
    next(error);
  }
});

export const getMutualFundData = asyncHandler(async (req, res, next) => {
  const { schemeCode } = req.params;
  // console.log("Fetching data for scheme code:", schemeCode);
  
  const query = `
    SELECT 
        s.scheme_name,
        s.about,
        f.logo_url AS fundhouse_logo
    FROM 
        Scheme s
    JOIN 
        FundHouse f
    ON 
        s.fundhouse_id = f.id
    WHERE 
        s.scheme_code = $1;
`;

  try {
    // Query the database for the logo
    // const logoQuery = 'SELECT mflogo, about FROM mutualfunds WHERE id = $1';
    const logoResult = await pool.query(query, [schemeCode]);
    // const logoResult1 = await pool.query(logoQuery, [48]);
    const logo = logoResult.rows.length > 0 ? logoResult.rows[0] : null;

    // Fetch mutual fund data from the external API
    const url = `https://api.mfapi.in/mf/${schemeCode}`;
    const response = await axios.get(url);

    if (!response.data || !response.data.data) {
      throw new Error("No data found for the provided scheme code");
    }

    const navData = response.data.data;

    // Convert NAV data to an easier format
    const navByDate = navData.reduce((acc, item) => {
      acc[item.date] = parseFloat(item.nav);
      return acc;
    }, {});

    const formatDate = (date) =>
      date.toISOString().split("T")[0].split("-").reverse().join("-");

    const findPreviousDateWithNAV = (date) => {
      while (!navByDate[formatDate(date)] && date > new Date("1970-01-01")) {
        date.setDate(date.getDate() - 1); // Move to the previous day
      }
      return formatDate(date);
    };

    const today = new Date();
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(today.getDate() - 1);

    const twoDayAgo = new Date(today);
    twoDayAgo.setDate(today.getDate() - 2);

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const threeYearsAgo = new Date(today);
    threeYearsAgo.setFullYear(today.getFullYear() - 3);

    const fiveYearAgo = new Date(today);
    fiveYearAgo.setFullYear(today.getFullYear() - 5);

    const oneDayAgoFormatted = findPreviousDateWithNAV(oneDayAgo);
    const twoDayAgoFormatted = findPreviousDateWithNAV(twoDayAgo);
    const oneMonthAgoFormatted = findPreviousDateWithNAV(oneMonthAgo);
    const threeMonthsAgoFormatted = findPreviousDateWithNAV(threeMonthsAgo);
    const sixMonthsAgoFormatted = findPreviousDateWithNAV(sixMonthsAgo);
    const oneYearAgoFormatted = findPreviousDateWithNAV(oneYearAgo);
    const threeYearAgoFormatted = findPreviousDateWithNAV(threeYearsAgo);
    const fiveYearAgoFormatted = findPreviousDateWithNAV(fiveYearAgo);

    // console.log("Dates used:");
    // console.log("One day ago:", oneDayAgoFormatted);
    // console.log("Two day ago:", twoDayAgoFormatted);
    // console.log("One month ago:", oneMonthAgoFormatted);
    // console.log("Three months ago:", threeMonthsAgoFormatted);
    // console.log("Six months ago:", sixMonthsAgoFormatted);
    // console.log("One Year ago:", oneYearAgoFormatted);
    // console.log("THREE Year ago:", threeYearAgoFormatted);
    // console.log("Five Year ago:", fiveYearAgoFormatted);

    //const currentNAV = navByDate[oneDayAgoFormatted]; // Latest NAV

    const inceptionNAV = parseFloat(navData[navData.length - 1].nav); // Earliest NAV (from the first available date)
    const currentNAV = parseFloat(navData[0].nav); // Latest NAV (from the most recent available date)

    // console.log("Inception NAV:", inceptionNAV);
    // console.log("Current NAV:", currentNAV);

    const calculateReturn = (startDate) => {
      const previousNAV = navByDate[startDate];
      if (!previousNAV || !currentNAV) return null;
      return ((currentNAV - previousNAV) / previousNAV) * 100;
    };

    const perDayReturn = calculateReturn(twoDayAgoFormatted);
    const monthlyReturn = calculateReturn(oneMonthAgoFormatted);
    const threeMonthsReturn = calculateReturn(threeMonthsAgoFormatted);
    const sixMonthsReturn = calculateReturn(sixMonthsAgoFormatted);
    const oneYearReturn = calculateReturn(oneYearAgoFormatted);
    const threeYearReturn = calculateReturn(threeYearAgoFormatted);
    const fiveYearReturn = calculateReturn(fiveYearAgoFormatted);

    // Calculate the inception-to-current return
    const inceptionToCurrentReturn = calculateReturn(
      navData[navData.length - 1].date
    );

    const fundDataWithLogo = {
      ...response.data,
      logo: logo || "default-logo-url-or-path",
      returns: {
        perDay:
          perDayReturn !== null
            ? `${perDayReturn.toFixed(2)}%`
            : "Data unavailable",
        monthly:
          monthlyReturn !== null
            ? `${monthlyReturn.toFixed(2)}%`
            : "Data unavailable",
        threeMonths:
          threeMonthsReturn !== null
            ? `${threeMonthsReturn.toFixed(2)}%`
            : "Data unavailable",
        sixMonths:
          sixMonthsReturn !== null
            ? `${sixMonthsReturn.toFixed(2)}%`
            : "Data unavailable",
        oneYear:
          oneYearReturn !== null
            ? `${oneYearReturn.toFixed(2)}%`
            : "Data unavailable",
        threeYear:
          threeYearReturn !== null
            ? `${threeYearReturn.toFixed(2)}%`
            : "Data unavailable",
        fiveYear:
          fiveYearReturn !== null
            ? `${fiveYearReturn.toFixed(2)}%`
            : "Data unavailable",
        inceptionToCurrent:
          inceptionToCurrentReturn !== null
            ? `${inceptionToCurrentReturn.toFixed(2)}%`
            : "Data unavailable",
      },
    };

    handleResponse(
      res,
      200,
      "Mutual Fund Data Retrieved Successfully",
      fundDataWithLogo
    );
  } catch (error) {
    console.error("Error fetching fund data:", error.message);
    next(error);
  }
});

export const getAllMutualFund = asyncHandler(async (req, res, next) => {

  const query = `
            SELECT 
                s.id AS scheme_id,
                s.scheme_code,
                s.scheme_name,
                s.aum,
                f.logo_url AS fundhouse_logo
            FROM 
                Scheme s
            JOIN 
                FundHouse f
            ON 
                s.fundhouse_id = f.id;
        `;
  const data = await pool.query(query);
  if (!data) {
    throw new ApiError("Fund Not Found");
  }
  handleResponse(res, 200, "FUnd Found Successfully", data.rows);
});

export const getFundHouse = asyncHandler(async(req,res,next)=>{
  const query = `SELECT * FROM fundhouse`;

  const data = await pool.query(query);
  if (!data) {
    throw new ApiError("Fund Not Found");
  }
  handleResponse(res, 200, "FUnd Found Successfully", data.rows);
})
