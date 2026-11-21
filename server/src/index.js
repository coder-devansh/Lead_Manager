import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import leadsRouter from "./routes/leads.js";
import authRouter from "./routes/auth.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (process.env.SERVE_CLIENT === "true") return callback(null, true);
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origin not allowed"));
  }
}));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/leads", leadsRouter);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

if (process.env.SERVE_CLIENT === "true") {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      return res.sendFile(path.join(clientDist, "index.html"));
    }
    next();
  });
}

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === "ValidationError") {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, detail]) => [field, detail.message])
    );
    return res.status(400).json({ message: "Validation failed", errors });
  }
  res.status(500).json({ message: "An unexpected server error occurred" });
});

async function start() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in production");
  }
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lead_manager";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

if (process.env.NODE_ENV !== "test") start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

export { app };
