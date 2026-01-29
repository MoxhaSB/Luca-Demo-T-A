// src/routes/factura.route.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  emitirFacturaController,
  listarFacturasController,
  obtenerFacturaController,
} from "../controllers/factura.controller.js";

const router = Router();

// POST /factura/emitir
router.post("/emitir", requireAuth, emitirFacturaController);

// GET /factura
router.get("/", requireAuth, listarFacturasController);

// GET /factura/:id
router.get("/:id", requireAuth, obtenerFacturaController);

export default router;
