import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import fetch from "node-fetch";
import cron from "node-cron";
import routes from "./routes/index.js";
import { resolve } from "path";

const app = express();

app.use(morgan("common", { stream: fs.createWriteStream(resolve(".log"), { flags: "a" }) }))
    .use(cors())
    .use(express.json())
    .use(express.static(resolve("public")))

    .get("/", (_, r) => r.sendFile(resolve("public/index.html")))

    .use("/api/province", routes.province)
    .use("/api/regioni", routes.regioni)
    .use("/api/nazionale", routes.nazionale)

    .use("*", (_q, r, _n) => r.status(404));

const schedule = cron.schedule("30 18 * * *", fetchData, { scheduled: true, timezone: "Europe/Rome" });

app.listen(process.env.PORT || 4000, () => {
    fetchData();
    schedule.start();
});

async function fetchProvinceNew() {
    let data = await fetchAPI("province-latest");
    data = data.filter(
        d =>
            d.denominazione_provincia !== "Fuori Regione / Provincia Autonoma" &&
            d.denominazione_provincia !== "In fase di definizione/aggiornamento"
    );

    let out = {};
    for (let i of data) {
        out[i.denominazione_provincia] = { data: i.data, totale_casi: i.totale_casi };
    }
    fs.writeFile("data/province-latest.json", JSON.stringify(out), err => (err ? console.log(err) : null));
}

async function fetchRegionNew() {
    let data = await fetchAPI("regioni-latest");
    data = data.filter(d => !d.denominazione_regione.includes("P.A."));

    let out = {};
    for (let i of data) {
        const {
            stato,
            codice_regione,
            denominazione_regione,
            lat,
            long,
            casi_da_sospetto_diagnostico,
            casi_da_screening,
            note,
            note_test,
            note_casi,
            codice_nuts_1,
            codice_nuts_2,
            ...json
        } = i;
        out[denominazione_regione] = json;
    }

    fs.writeFile("data/regioni-latest.json", JSON.stringify(out), err => (err ? console.log(err) : null));
}

async function fetchNationalNew() {
    const data = await fetchAPI("andamento-nazionale-latest");
    const { stato, casi_da_sospetto_diagnostico, casi_da_screening, note, note_test, note_casi, ...json } = data[0];
    fs.writeFile("data/nazionale-latest.json", JSON.stringify(json), err => (err ? console.log(err) : null));
}

async function fetchProvinceAll() {
    let data = await fetchAPI("province");
    data = data.filter(
        d =>
            d.denominazione_provincia !== "Fuori Regione / Provincia Autonoma" &&
            d.denominazione_provincia !== "In fase di definizione/aggiornamento"
    );

    let out = {};
    for (let i of data) {
        if (out[i.denominazione_provincia]?.push({ data: i.data, totale_casi: i.totale_casi }) === undefined)
            out[i.denominazione_provincia] = [];
    }

    fs.writeFile("data/province.json", JSON.stringify(out), err => (err ? console.log(err) : null));
}

async function fetchRegionAll() {
    let data = await fetchAPI("regioni");
    data = data.filter(d => !d.denominazione_regione.includes("P.A."));

    let out = {};
    for (let i of data) {
        const {
            stato,
            codice_regione,
            denominazione_regione,
            lat,
            long,
            casi_da_sospetto_diagnostico,
            casi_da_screening,
            note,
            note_test,
            note_casi,
            codice_nuts_1,
            codice_nuts_2,
            ...json
        } = i;
        if (out[denominazione_regione]?.push(json) === undefined) out[denominazione_regione] = [];
    }

    fs.writeFile("data/regioni.json", JSON.stringify(out), err => (err ? console.log(err) : null));
}

async function fetchNationalAll() {
    const data = await fetchAPI("andamento-nazionale");
    fs.writeFile(
        "data/nazionale.json",
        JSON.stringify(
            data.map(d => {
                const { stato, casi_da_sospetto_diagnostico, casi_da_screening, note, note_test, note_casi, ...json } = d;
                return json;
            })
        ),
        err => (err ? console.log(err) : null)
    );
}

async function fetchAPI(file) {
    const req = await fetch(`https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-${file}.json`);
    return await req.json();
}

function fetchData() {
    fetchProvinceNew();
    fetchProvinceAll();
    fetchRegionNew();
    fetchRegionAll();
    fetchNationalNew();
    fetchNationalAll();
}
