
import { Router } from 'express';
import { getLiveLocation, getRouteInfo } from '../controllers/student.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

router.get('/live-location', [verifyToken, requireStudent], getLiveLocation);
router.get('/route-info', [verifyToken, requireStudent], getRouteInfo);

export default router;
