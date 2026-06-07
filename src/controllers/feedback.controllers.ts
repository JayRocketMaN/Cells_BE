import type { Request, Response } from 'express';
import * as feedbackService from '../services/feedback.services.js';

export const postFeedback = async (req: Request, res: Response) => {
  try {
    const companyId = req.body.company_id || req.query.company_id;
    const { rating, comment, customerId } = req.body;

    if (!companyId || !rating) return res.status(400).json({ error: "Missing required fields" });

    const feedback = await feedbackService.submitFeedback(companyId, { 
        rating, 
        comment, 
        customer_id: customerId 
    });

    /** 
     * GOOGLE REVIEW FUNNEL: 
     * Uses the Place ID from .env to build the specific "Write a Review" link.
     */
    const placeId = process.env.GOOGLE_PLACE_ID;    
    const googleReviewUrl = `https://google.com{placeId}`;

    
    // Logic: Redirect only happy customers (4-5 stars) to Google
    const shouldPromptGoogle = rating >= 4;

    res.status(201).json({
      message: "Feedback recorded internally",
      data: feedback,
      promptGoogle: shouldPromptGoogle,
      googleUrl: shouldPromptGoogle ? googleReviewUrl : null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const companyId = req.query.company_id as string || req.user?.companyId;
    if (!companyId) return res.status(400).json({ error: "Missing company_id" });

    const stats = await feedbackService.getFeedbackStats(companyId);
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getReviewList = async (req: Request, res: Response) => {
  try {
    const companyId = req.query.company_id as string || req.user?.companyId;
    if (!companyId) return res.status(400).json({ error: "Missing company_id" });

    const reviews = await feedbackService.getAllReviews(companyId as string);
    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
