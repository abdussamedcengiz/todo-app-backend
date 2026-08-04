import express from "express";
import "dotenv/config";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import todoRoutes from "./routes/todo.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "https://todo-app-frontend-puce-nine.vercel.app"]
}));
app.use(express.json());

app.use("/", authRoutes);
app.use("/todos", todoRoutes);

app.use(errorHandler);

export default app;
