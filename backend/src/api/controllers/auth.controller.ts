// Fix: Use `import type` for Express types to avoid type conflicts.
import type { Request, Response } from 'express';
import authService from '../services/auth.service';

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const result = await authService.loginUser(email, password);
        res.json(result);
    } catch (error) {
        console.error('Login error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        
        if (errorMessage.includes('User not found')) {
            return res.status(404).json({ message: errorMessage });
        }
        if (errorMessage.includes('Invalid credentials')) {
            return res.status(401).json({ message: errorMessage });
        }
        res.status(500).json({ message: 'Server error during login.' });
    }
};