import * as bodyParser from 'body-parser';
import express from 'express';
import { router } from 'routes';
import * as errorHandler from 'utils/errorHandler';

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.use('/', router);

app.use(errorHandler.handleUnknownError);

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server started on :${port}`);
});
