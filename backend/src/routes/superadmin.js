import express from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import { authMiddleware } from '../middleware/auth.js';
import { isSuperAdmin } from '../middleware/roleMiddleware.js';
import logger from '../utils/logger.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// All superadmin routes require authentication and superadmin role
router.use(authMiddleware);
router.use(isSuperAdmin);

/**
 * GET /api/superadmin/users
 * Get all users in the system
 */
router.get('/users', async (req, res) => {
  try {
    logger.info('📋 Fetching all users', { superadminId: req.user.id });
    
    const users = await DatabaseService.getAllUsers();
    
    res.json({
      success: true,
      users,
      total: users.length
    });
  } catch (error) {
    logger.error('Failed to fetch users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * POST /api/superadmin/users/:userId/approve
 * Approve a pending user
 */
router.post('/users/:userId/approve', async (req, res) => {
  try {
    const { userId } = req.params;
    const superadminId = req.user.id;
    
    logger.info('✅ Approving user', { userId, superadminId });
    
    const user = await DatabaseService.approveUser(userId, superadminId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User approved successfully',
      user
    });
  } catch (error) {
    logger.error('Failed to approve user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve user'
    });
  }
});

/**
 * POST /api/superadmin/users/:userId/deactivate
 * Deactivate a user
 */
router.post('/users/:userId/deactivate', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const superadminId = req.user.id;
    
    // Prevent self-deactivation
    if (userId === superadminId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account'
      });
    }
    
    logger.info('🚫 Deactivating user', { userId, superadminId, reason });
    
    const user = await DatabaseService.deactivateUser(userId, superadminId, reason);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    logger.error('Failed to deactivate user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate user'
    });
  }
});

const reactivateUserHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const superadminId = req.user.id;
    
    logger.info('✅ Reactivating user', { userId, superadminId });
    
    const user = await DatabaseService.reactivateUser(userId, superadminId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User reactivated successfully',
      user
    });
  } catch (error) {
    logger.error('Failed to reactivate user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate user'
    });
  }
};

/**
 * POST /api/superadmin/users/:userId/activate
 * Legacy alias for reactivation
 */
router.post('/users/:userId/activate', reactivateUserHandler);

/**
 * POST /api/superadmin/users/:userId/reactivate
 * Reactivate a deactivated user (new endpoint)
 */
router.post('/users/:userId/reactivate', reactivateUserHandler);

/**
 * DELETE /api/superadmin/users/:userId
 * Permanently delete a user and their data
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const superadminId = req.user.id;

    if (userId === superadminId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    const targetUser = await DatabaseService.getUserById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info('🗑️ Permanently deleting user', { userId, superadminId });

    const deletedUser = await DatabaseService.deleteUser(userId, superadminId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (targetUser.auth_provider === 'supabase' && supabase) {
      try {
        await supabase.auth.admin.deleteUser(userId);
        logger.info('🧹 Supabase auth user removed', { userId });
      } catch (supabaseError) {
        logger.warn('Failed to delete Supabase auth user', {
          userId,
          error: supabaseError.message
        });
      }
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      user: deletedUser
    });
  } catch (error) {
    logger.error('Failed to delete user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

/**
 * GET /api/superadmin/users/:userId/projects
 * Get all projects for a specific user
 */
router.get('/users/:userId/projects', async (req, res) => {
  try {
    const { userId } = req.params;
    
    logger.info('📋 Fetching user projects', { userId, superadminId: req.user.id });
    
    // Get projects where user is admin
    const adminProjects = await DatabaseService.getAdminProjects(userId);
    
    // Get projects where user is invited
    const userProjects = await DatabaseService.getUserProjects(userId);
    
    res.json({
      success: true,
      adminProjects,
      userProjects,
      total: adminProjects.length + userProjects.length
    });
  } catch (error) {
    logger.error('Failed to fetch user projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user projects'
    });
  }
});

/**
 * POST /api/superadmin/users/:userId/make-superadmin
 * Promote a user to superadmin role
 */
router.post('/users/:userId/make-superadmin', async (req, res) => {
  try {
    const { userId } = req.params;
    const superadminId = req.user.id;
    
    logger.info('👑 Promoting user to superadmin', { userId, promotedBy: superadminId });
    
    // Check if user exists
    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Activate user if not active
    if (!user.is_active || user.pending_approval) {
      await DatabaseService.reactivateUser(userId, superadminId);
      await DatabaseService.approveUser(userId, superadminId);
    }
    
    // Add superadmin role
    const result = await DatabaseService.assignSuperadminRole(userId);
    
    res.json({
      success: true,
      message: 'User promoted to superadmin successfully',
      user: result
    });
  } catch (error) {
    logger.error('Failed to promote user to superadmin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to promote user to superadmin'
    });
  }
});

/**
 * GET /api/superadmin/stats
 * Get system statistics
 */
router.get('/stats', async (req, res) => {
  try {
    logger.info('📊 Fetching system stats', { superadminId: req.user.id });
    
    const users = await DatabaseService.getAllUsers();
    
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.is_active).length,
      pendingApproval: users.filter(u => u.pending_approval).length,
      deactivatedUsers: users.filter(u => !u.is_active && !u.pending_approval).length,
      superadmins: users.filter(u => u.role === 'superadmin').length,
      admins: users.filter(u => u.role === 'admin').length,
      regularUsers: users.filter(u => u.role === 'user' || !u.role).length
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to fetch stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system statistics'
    });
  }
});

export default router;

