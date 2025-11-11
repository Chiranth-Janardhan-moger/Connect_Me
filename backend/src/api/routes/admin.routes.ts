import { Router } from 'express';
import { addStudent, addDriver, addRoute, getAllRoutes, getUsers, deleteUser } from '../controllers/admin.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

router.use(verifyToken, requireAdmin);

router.post('/add-student', addStudent);
router.post('/add-driver', addDriver);
router.post('/add-route', addRoute);
router.get('/routes', getAllRoutes);
router.get('/users', getUsers);
router.delete('/users/:userId', deleteUser);

export default router;
