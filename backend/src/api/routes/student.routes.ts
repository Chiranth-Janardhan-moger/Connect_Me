
import { Router } from 'express';
import { getLiveLocation } from '../controllers/student.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

router.get('/live-location', [verifyToken, requireStudent], getLiveLocation);

export default router;
