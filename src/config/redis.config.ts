import Redis from "ioredis";
import serverConfig from "./server.config.js";

const redisConfig = {
    host: serverConfig.REDIS_HOST,
    port: parseInt(serverConfig.REDIS_PORT || "6379"),
    maxRetriesPerRequest: null
}

const redisConnection = new Redis(redisConfig)
export default redisConnection;