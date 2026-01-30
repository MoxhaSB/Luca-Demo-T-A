import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  crearClienteController,
  listarClientesController,
  obtenerClienteController,
  actualizarClienteController,
  eliminarClienteController,
} from "../controllers/cliente.controller.js";

const router = Router();

// CRUD
router.post("/", requireAuth, crearClienteController);
router.get("/", requireAuth, listarClientesController);
router.get("/:id", requireAuth, obtenerClienteController);
router.put("/:id", requireAuth, actualizarClienteController);
router.delete("/:id", requireAuth, eliminarClienteController);

export default router;
