import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  crearProveedorController,
  listarProveedoresController,
  obtenerProveedorController,
  actualizarProveedorController,
  eliminarProveedorController,
} from "../controllers/proveedor.controller.js";

const router = Router();

router.post("/", requireAuth, crearProveedorController);
router.get("/", requireAuth, listarProveedoresController);
router.get("/:id", requireAuth, obtenerProveedorController);
router.put("/:id", requireAuth, actualizarProveedorController);
router.delete("/:id", requireAuth, eliminarProveedorController);

export default router;
