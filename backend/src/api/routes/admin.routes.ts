
import { Router } from 'express';
import { addStudent, addDriver, addRoute } from '../controllers/admin.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

// All routes in this file are protected and require admin role
router.use(verifyToken, requireAdmin);

router.post('/add-student', addStudent);
router.post('/add-driver', addDriver);
router.post('/add-route', addRoute);

export default router;
