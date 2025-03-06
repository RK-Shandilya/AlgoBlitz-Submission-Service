import mongoose from "mongoose";
import serverConfig from "./server.config.js";

export default async function dbConnect()  {
    try {
        if(serverConfig.NODE_ENV === "development") {
            if(serverConfig.DB_HOST === undefined) {
                throw new Error("DB_HOST is not set");
            }
            await mongoose.connect(serverConfig.DB_HOST);
            console.log("Database connected");
        }
    } catch (error) {
        console.log("Error connecting to database", error);
    }
}
