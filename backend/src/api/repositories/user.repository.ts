import User, { IUser } from '../../models/user.model';

class UserRepository {
    async findByEmail(email: string): Promise<IUser | null> {
        return User.findOne({ email }).exec();
    }

    async findByRollNumber(rollNumber: string): Promise<IUser | null> {
        return User.findOne({ rollNumber }).exec();
    }

    async findAllByRole(role?: string): Promise<IUser[]> {
        const query: any = {};
        if (role) query.role = role;
        return User.find(query).sort({ name: 1 }).exec();
    }

    async deleteById(userId: string): Promise<IUser | null> {
        return User.findByIdAndDelete(userId).exec();
    }

    async save(user: IUser): Promise<IUser> {
        return user.save();
    }
}

export default new UserRepository();