// src/routes/boleta.route.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  emitirBoletaController,
  listarBoletasController,
  obtenerBoletaController,
} from "../controllers/boleta.controller.js";

const router = Router();

// POST /boletas/emitir
router.post("/emitir", requireAuth, emitirBoletaController);

// GET /boletas
router.get("/", requireAuth, listarBoletasController);

// GET /boletas/:id
router.get("/:id", requireAuth, obtenerBoletaController);

export default router;
