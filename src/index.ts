import express, { Express } from "express";
import serverConfig from "./config/server.config.js";

const app: Express = express();

app.listen(serverConfig.PORT, () => {
    console.log(`Server is listening on port ${serverConfig.PORT}`);
})