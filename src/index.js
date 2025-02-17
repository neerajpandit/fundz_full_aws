import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import pool from "./config/db.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import morgan from "morgan";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';

import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import mfRoutes from "./routes/mfRoutes.js";
import errorHandling from "./middlewares/errorHandler.js";
import { createTables } from "./data/tableCreation.js";
import { trackVisitor } from "./middlewares/trackVisitor.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("combined"));

const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory);
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });
if (process.env.NODE_ENV === 'production') {
    // In production: Use "combined" format and log to a file
    app.use(morgan('combined', { stream: accessLogStream }));
} else {
    // In development: Use "dev" format (concise, colored logs)
    app.use(morgan('dev'));
}
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies
  })
);
app.use(trackVisitor);
// app.use(helmet());
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       imgSrc: ["'self'","*","https://fundzz.com","http://fundzz.com", "https://img.icons8.com"],
//       connectSrc: ["'self'","*","https://newsapi.org", "https://fundzz.com"],
//     },
//   })
// );
app.use(
  rateLimit({
    windowMs: 5 * 60 * 60 * 1000,// 3 hours
    max: 100,
    message: "",
  })
); 

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/mf", mfRoutes);

// Serve React frontend build
const buildPath = path.join(__dirname, "dist");
app.use(express.static(buildPath));

app.get('/download-logs', (req, res) => {
  const logFilePath = path.join(__dirname,"logs", 'access.log'); // Path to the log file
  console.log('Downloading log file:', logFilePath);
  
  res.download(logFilePath, 'app.log', (err) => {
      if (err) {
          logger.error('Error downloading log file:', err);
          res.status(500).send('Error downloading log file');
      }
  });
});

// SPA fallback for React routing
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});



// Error handling middleware
app.use(errorHandling);
app.use((err, req, res, next) => {
  if (err instanceof Error && err.code) {
    console.error("Database error:", err);
    res.status(500).json({ message: "A database error occurred" });
  } else {
    next(err);
  }
});

// Database setup and server start
(async () => {
  try {
    await pool.connect();
    console.log("Database connected successfully.");
    await createTables();
    console.log("Database setup completed.");

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error during database setup:", error.message);
    process.exit(1);
  }
})();
