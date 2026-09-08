/* @refresh reload */
import { lazy } from "solid-js";
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";

import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./theme";
import "./scss/styles.scss";

import Layout from "./components/common/Layout";
import NotFound from "./components/common/NotFound";

const Home = lazy(() => import("./routes/index"));
const BarcodeReader = lazy(() => import("./routes/barcode_reader"));
const BarcodeWriter = lazy(() => import("./routes/barcode_writer"));
const CsvSwap = lazy(() => import("./routes/csv_swap"));
const CsvToTable = lazy(() => import("./routes/csv_to_table"));
const HtmlCheck = lazy(() => import("./routes/htmlcheck"));
const Ocr = lazy(() => import("./routes/ocr"));
const PasswordGenerator = lazy(() => import("./routes/password_generator"));
const Translate = lazy(() => import("./routes/translate"));

render(
    () => (
        <Router root={Layout}>
            <Route path="/" component={Home} />
            <Route path="/barcode_reader" component={BarcodeReader} />
            <Route path="/barcode_writer" component={BarcodeWriter} />
            <Route path="/csv_swap" component={CsvSwap} />
            <Route path="/csv_to_table" component={CsvToTable} />
            <Route path="/htmlcheck" component={HtmlCheck} />
            <Route path="/ocr" component={Ocr} />
            <Route path="/password_generator" component={PasswordGenerator} />
            <Route path="/translate" component={Translate} />
            <Route path="*" component={NotFound} />
        </Router>
    ),
    document.getElementById("root")!,
);
