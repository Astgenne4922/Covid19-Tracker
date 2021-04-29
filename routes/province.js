import { resolve } from "path";
import { Router } from "express";
import fs from "fs";

const router = Router();
const all = resolve("data/province.json");
const latest = resolve("data/province-latest.json");

router
    .get("/", (_, res) => {
        fs.readFile(all, (err, data) => {
            if (err) throw err;
            res.json(Object.keys(JSON.parse(data)));
        });
    })

    .get("/all", (_, res) => res.sendFile(all))
    .get("/all/:nomeProvincia", (req, res) => {
        fs.readFile(all, (err, data) => {
            if (err) throw err;
            res.json(JSON.parse(data)[req.params.nomeProvincia] ?? null);
        });
    })

    .get("/latest", (_, res) => res.sendFile(latest))
    .get("/latest/:nomeProvincia", (req, res) => {
        fs.readFile(latest, (err, data) => {
            if (err) throw err;
            res.json(JSON.parse(data)[req.params.nomeProvincia] ?? null);
        });
    });

export default router;
