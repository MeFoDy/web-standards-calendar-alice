import { Router } from 'express';
import * as ipRoutes from './ip';

export const router = Router();

router.use('/ip', ipRoutes.router);
