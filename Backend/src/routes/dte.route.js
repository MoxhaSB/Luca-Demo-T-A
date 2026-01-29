// src/routes/dte.route.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  generarDteDemoController,
  listarDtesController,
  obtenerDteController,
} from "../controllers/dte.demo.controller.js";

const router = Router();

// DEMO JSON
router.post("/generar", requireAuth, generarDteDemoController);
router.get("/", requireAuth, listarDtesController);
router.get("/:id", requireAuth, obtenerDteController);

export default router;
