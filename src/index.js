import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import pool from "./config/db.js";
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit'
import morgan from 'morgan'
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from 'url';

import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
// import bankRoutes from "./routes/bankRoutes.js";
// import nomineeRoutes from "./routes/nomineeRoutes.js";
// import addressRoutes from "./routes/addressRoutes.js";
// import kycRoutes from "./routes/kycRoutes.js";
// import uccRoutes from "./routes/uccprofileRoutes.js"
import errorHandling from "./middlewares/errorHandler.js";
import {createTables} from "./data/tableCreation.js"


dotenv.config();


const app = express();
const port = process.env.PORT || 8000;

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React build
// const buildPath = path.join(__dirname, 'dist');
// app.use(express.static(buildPath));

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
// app.get('*', (req, res) => {
//   res.sendFile(path.join(buildPath, 'index.html'));
// });
// Handle SPA routing


// Middlewares
app.use(express.json());
// app.use(cors());
app.use(cookieParser());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true, // Allow cookies
  })
);
app.use(helmet());
// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
// Parse JSON requests
app.use(bodyParser.json());

// Parse URL-encoded requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));



// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/blog",blogRoutes);
// app.use("/api/v1/nominee",nomineeRoutes);
// app.use("/api/v1/address",addressRoutes);
// app.use("/api/v1/kyc",kycRoutes);
// app.use("/api/v1/uccprofile",uccRoutes);


// Error handling middleware
app.use(errorHandling);
// Global error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof Error && err.code) {
      console.error('Database error:', err);
      res.status(500).json({ message: 'A database error occurred' });
  } else {
      next(err);
  }
});


//Create table before starting server
// createUserProfile();
// createBankDetails();
// createUserTable();

// Testing POSTGRES Connection
app.get("/", async (req, res) => {
  console.log("Start");
  const result = await pool.query("SELECT current_database()");
  console.log("result", result.rows);
  res.send(`The database name is : ${result.rows[0].current_database}`);
});

(async () => {
  try {
    pool.connect();
    console.log("Database connected successfully.");
    await createTables();
    console.log("Database setup completed.");
    // Start your server or any other application logic here
  } catch (error) {
    console.error("Error during database setup:", error.message);
    process.exit(1);
    
  }
})();

// Server running
pool.connect()
.then(client => {
    app.listen(port,'0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
    console.log("Connected to PostgreSQL");
    client.release(); // Don't forget to release the client
  }).catch(err => {
    console.error("Error connecting to PostgreSQL:", err.stack);
  });


// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

