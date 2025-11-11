import Feedback from '../models/feedback.model';

const Sentiment = require('sentiment');
const sentiment = new Sentiment();

class FeedbackService {
  async submitFeedback(data: {
    routeNumber: number;
    driverId?: string;
    rating: number;
    category: string;
    comment?: string;
  }) {
    try {
      let sentimentScore = 0;
      let sentimentLabel = 'neutral';

      if (data.comment) {
        const result = sentiment.analyze(data.comment);
        sentimentScore = result.score;
        sentimentLabel = result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral';
      }

      const feedback = await Feedback.create({
        ...data,
        sentiment: sentimentLabel,
        sentimentScore,
        timestamp: new Date(),
      });

      console.log(`✅ Feedback submitted: ${data.rating} stars, ${sentimentLabel}`);
      return { success: true, feedback };
    } catch (error) {
      console.error('Feedback submission error:', error);
      return { success: false, error };
    }
  }

  async getAggregatedFeedback(routeNumber?: number) {
    try {
      const query = routeNumber ? { routeNumber } : {};
      
      const feedbacks = await Feedback.find(query);
      
      const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
      const sentimentCounts = feedbacks.reduce((acc, f) => {
        acc[f.sentiment] = (acc[f.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        data: {
          totalFeedbacks: feedbacks.length,
          averageRating: avgRating.toFixed(2),
          sentimentBreakdown: sentimentCounts,
        },
      };
    } catch (error) {
      console.error('Get feedback error:', error);
      return { success: false, error };
    }
  }
}

export default new FeedbackService();
