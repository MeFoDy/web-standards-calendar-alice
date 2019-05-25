import { Router } from 'express';
import * as calRoutes from './cal';

export const router = Router();

router.use('/cal', calRoutes.router);
