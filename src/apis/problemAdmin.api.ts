import axios from "axios";
import serverConfig from "../config/server.config.js";

export default async function fetchProblemDetails(problemID: string) {
    try {
        const reponse = await axios.get(`${serverConfig.PROBLEM_ADMIN_SERVICE_URL}/api/v1/problems/${problemID}`);
        return reponse.data;
    } catch (error) {
        console.log("Error fetching problem details", error);
    }
}