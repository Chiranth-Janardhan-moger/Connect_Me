import User, { IUser } from '../../models/user.model';

class UserRepository {
    async findByEmail(email: string): Promise<IUser | null> {
        return User.findOne({ email }).exec();
    }

    async save(user: IUser): Promise<IUser> {
        return user.save();
    }
}

export default new UserRepository();