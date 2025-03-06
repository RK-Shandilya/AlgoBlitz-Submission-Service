process.loadEnvFile();

export default {
    PORT: process.env.PORT || 4001,
    DB_HOST: process.env.DB_HOST,
    NODE_ENV: process.env.NODE_ENV || "developemnt",
    PROBLEM_ADMIN_SERVICE_URL: process.env.PROBLEM_ADMIN_SERVICE_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT || "6379"
}