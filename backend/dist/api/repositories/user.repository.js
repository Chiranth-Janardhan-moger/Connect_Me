"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("../../models/user.model"));
class UserRepository {
    async findByEmail(email) {
        return user_model_1.default.findOne({ email }).exec();
    }
    async findByRollNumber(rollNumber) {
        return user_model_1.default.findOne({ rollNumber }).exec();
    }
    async findAllByRole(role) {
        const query = {};
        if (role)
            query.role = role;
        return user_model_1.default.find(query).sort({ name: 1 }).exec();
    }
    async deleteById(userId) {
        return user_model_1.default.findByIdAndDelete(userId).exec();
    }
    async save(user) {
        return user.save();
    }
}
exports.default = new UserRepository();
