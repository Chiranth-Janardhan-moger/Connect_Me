import jwt from 'jsonwebtoken';
import config from '../../config';
import userRepository from '../repositories/user.repository';
import { UserRole } from '../../models/user.model';

class AuthService {
    async loginUser(email: string, password: string) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new Error('User not found.');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid credentials.');
        }

        const payload = {
            id: user._id,
            role: user.role,
            busId: user.busId,
        };

        const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });

        return {
            token,
            user: {
                _id: user._id,
                name: user.name,
                role: user.role,
                busId: user.busId,
            },
        };
    }
}

export default new AuthService();
