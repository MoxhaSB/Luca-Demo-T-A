import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  generarSobreController,
  enviarSobreController,
  listarSobresController,
  obtenerSobreController,
} from "../controllers/sobre.controller.js";

const router = Router();

// memoria (igual que DTE)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// POST /sobre/generar  (multipart: input + files[])
router.post(
  "/generar",
  requireAuth,
  upload.array("files", 2), // 1) pfx  2) opcional
  generarSobreController
);

// POST /sobre/enviar  (multipart: input + files[])
router.post(
  "/enviar",
  requireAuth,
  upload.array("files", 2),
  enviarSobreController
);

// GET /sobre
router.get("/", requireAuth, listarSobresController);

// GET /sobre/:id
router.get("/:id", requireAuth, obtenerSobreController);

export default router;
