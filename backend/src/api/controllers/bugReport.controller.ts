import { Request, Response } from 'express';
import BugReport from '../../models/bugReport.model';
import User from '../../models/user.model';

/**
 * Submit bug report
 */
export const submitBugReport = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const user = (req as any).user;

    console.log('🐛 [BUG REPORT] Received bug report from user:', user.id);

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    // Fetch user details
    const userDoc = await User.findById(user.id).select('name role');
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bugReport = new BugReport({
      userId: user.id,
      userName: userDoc.name,
      userRole: userDoc.role,
      message: message.trim(),
      status: 'pending',
    });

    await bugReport.save();
    console.log('✅ [BUG REPORT] Bug report saved:', bugReport._id);

    res.json({
      success: true,
      message: 'Bug report submitted successfully',
      reportId: bugReport._id,
    });
  } catch (error: any) {
    console.error('❌ [BUG REPORT] Error:', error);
    res.status(500).json({ error: 'Failed to submit bug report' });
  }
};

/**
 * Get all bug reports (Admin only)
 */
export const getAllBugReports = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const user = (req as any).user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const reports = await BugReport.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      reports,
      count: reports.length,
    });
  } catch (error: any) {
    console.error('❌ [BUG REPORT] Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch bug reports' });
  }
};

/**
 * Update bug report status (Admin only)
 */
export const updateBugReportStatus = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    const user = (req as any).user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await BugReport.findByIdAndUpdate(
      reportId,
      { status, adminNotes },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    res.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('❌ [BUG REPORT] Error updating status:', error);
    res.status(500).json({ error: 'Failed to update bug report' });
  }
};

/**
 * Delete bug report (Admin only)
 */
export const deleteBugReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const user = (req as any).user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const report = await BugReport.findByIdAndDelete(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    res.json({
      success: true,
      message: 'Bug report deleted',
    });
  } catch (error: any) {
    console.error('❌ [BUG REPORT] Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete bug report' });
  }
};
