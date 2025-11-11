"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const feedback_model_1 = __importDefault(require("../models/feedback.model"));
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
class FeedbackService {
    async submitFeedback(data) {
        try {
            let sentimentScore = 0;
            let sentimentLabel = 'neutral';
            if (data.comment) {
                const result = sentiment.analyze(data.comment);
                sentimentScore = result.score;
                sentimentLabel = result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral';
            }
            const feedback = await feedback_model_1.default.create({
                ...data,
                sentiment: sentimentLabel,
                sentimentScore,
                timestamp: new Date(),
            });
            console.log(`✅ Feedback submitted: ${data.rating} stars, ${sentimentLabel}`);
            return { success: true, feedback };
        }
        catch (error) {
            console.error('Feedback submission error:', error);
            return { success: false, error };
        }
    }
    async getAggregatedFeedback(routeNumber) {
        try {
            const query = routeNumber ? { routeNumber } : {};
            const feedbacks = await feedback_model_1.default.find(query);
            const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
            const sentimentCounts = feedbacks.reduce((acc, f) => {
                acc[f.sentiment] = (acc[f.sentiment] || 0) + 1;
                return acc;
            }, {});
            return {
                success: true,
                data: {
                    totalFeedbacks: feedbacks.length,
                    averageRating: avgRating.toFixed(2),
                    sentimentBreakdown: sentimentCounts,
                },
            };
        }
        catch (error) {
            console.error('Get feedback error:', error);
            return { success: false, error };
        }
    }
}
exports.default = new FeedbackService();
