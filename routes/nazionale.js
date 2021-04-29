import { resolve } from "path";
import { Router } from "express";

const router = Router();

router
    .get("/all", (_, res) => res.sendFile(resolve("data/nazionale.json")))
    .get("/latest", (_, res) => res.sendFile(resolve("data/nazionale-latest.json")));

export default router;
