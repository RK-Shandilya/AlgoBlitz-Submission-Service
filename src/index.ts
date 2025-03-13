import express, { Express} from 'express';
import cors from 'cors';
import dbConnect from './config/db.config.js';
import serverConfig from './config/server.config.js';
import errorHandler from './utils/errorHandler.js';
import evaluationWorker from './workers/evaluation.worker.js';
import apiRoutes from './routes/index.js';

const app: Express = express();

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.use(errorHandler);

dbConnect();

evaluationWorker("EvaluationQueue");

app.listen(serverConfig.PORT, async() => {
    console.log(`Server is running on port ${serverConfig.PORT}`);
});
