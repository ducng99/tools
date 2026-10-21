/* @refresh reload */
import { lazy } from "solid-js";
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";

import "./theme";
import "./scss/styles.scss";
import "bootstrap-icons/font/bootstrap-icons.css";

import Layout from "./components/common/Layout";
import NotFound from "./components/common/NotFound";

const Home = lazy(() => import("./routes/index"));
const BarcodeReader = lazy(() => import("./routes/barcode_reader"));
const BarcodeWriter = lazy(() => import("./routes/barcode_writer"));
const CsvSwap = lazy(() => import("./routes/csv_swap"));
const CsvToTable = lazy(() => import("./routes/csv_to_table"));
const Deckcraft = lazy(() => import("./routes/deckcraft"));
const Filmcraft = lazy(() => import("./routes/filmcraft"));
const Gridcraft = lazy(() => import("./routes/gridcraft"));
const HtmlCheck = lazy(() => import("./routes/htmlcheck"));
const Lightcraft = lazy(() => import("./routes/lightcraft"));
const Ocr = lazy(() => import("./routes/ocr"));
const PasswordGenerator = lazy(() => import("./routes/password_generator"));
const Pdfcraft = lazy(() => import("./routes/pdfcraft"));
const Photocraft = lazy(() => import("./routes/photocraft"));
const Translate = lazy(() => import("./routes/translate"));
const Wordcraft = lazy(() => import("./routes/wordcraft"));

render(
    () => (
        <Router root={Layout}>
            <Route path="/" component={Home} />
            <Route path="/barcode_reader" component={BarcodeReader} />
            <Route path="/barcode_writer" component={BarcodeWriter} />
            <Route path="/csv_swap" component={CsvSwap} />
            <Route path="/csv_to_table" component={CsvToTable} />
            <Route path="/deckcraft" component={Deckcraft} />
            <Route path="/filmcraft" component={Filmcraft} />
            <Route path="/gridcraft" component={Gridcraft} />
            <Route path="/htmlcheck" component={HtmlCheck} />
            <Route path="/lightcraft" component={Lightcraft} />
            <Route path="/ocr" component={Ocr} />
            <Route path="/password_generator" component={PasswordGenerator} />
            <Route path="/pdfcraft" component={Pdfcraft} />
            <Route path="/photocraft" component={Photocraft} />
            <Route path="/translate" component={Translate} />
            <Route path="/wordcraft" component={Wordcraft} />
            <Route path="*" component={NotFound} />
        </Router>
    ),
    document.getElementById("root")!,
);
