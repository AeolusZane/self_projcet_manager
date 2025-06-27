import express from 'express';
import { authenticateToken } from './auth';
import { AIAnalysisService } from '../services/aiAnalysisService';

const router = express.Router();

// 获取工作状态AI分析
router.get('/work-status', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const analysis = await AIAnalysisService.generateWorkStatusAnalysis(userId);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('获取AI分析失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI分析失败' 
    });
  }
});

// 获取任务趋势数据
router.get('/task-trends', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const days = parseInt(req.query.days as string) || 30;
    const trends = await AIAnalysisService.getTaskTrends(userId, days);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('获取任务趋势失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取任务趋势失败' 
    });
  }
});

// 获取任务统计摘要
router.get('/task-summary', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const tasks = await AIAnalysisService.getUserTaskData(userId);
    const analysis = AIAnalysisService.analyzeTaskData(tasks);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('获取任务摘要失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取任务摘要失败' 
    });
  }
});

export default router;