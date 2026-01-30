// src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";

import { ensureSeeded } from "./storage/seed.storage.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

import usuarioRouter from "./routes/usuario.route.js";
import chatRouter from "./routes/chat.route.js";
import boletaRouter from "./routes/boleta.route.js";
import facturaRouter from "./routes/factura.route.js";
import dteRouter from "./routes/dte.route.js";
import clienteRouter from "./routes/cliente.route.js";
import proveedorRouter from "./routes/proveedor.route.js";
import sobreRouter from "./routes/sobre.route.js";

const app = express();

// CORS "abierto" para demo/local
app.use(
  cors({
    origin: true, // refleja el Origin que llega
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight para cualquier ruta (EVITA "*")
app.options(/.*/, cors());

app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    nombre: "LUCA Demo API",
    estado: "running",
    mode: (process.env.APP_MODE || "demo").toLowerCase(),
  });
});

await ensureSeeded();

app.use("/usuario", usuarioRouter);
app.use("/chat", chatRouter);
app.use("/boleta", boletaRouter);
app.use("/factura", facturaRouter);
app.use("/dte", dteRouter);
app.use("/cliente", clienteRouter);
app.use("/proveedor", proveedorRouter);
app.use("/sobre", sobreRouter);

app.use(errorMiddleware);

const PORT = Number(process.env.PORT || 8000);
app.listen(PORT, () => {
  console.log(`[OK] API escuchando en http://localhost:${PORT}`);
});
