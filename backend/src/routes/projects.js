import express from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import { authMiddleware } from '../middleware/auth.js';
import { isAdmin, hasProjectAccess } from '../middleware/roleMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All project routes require authentication
router.use(authMiddleware);

/**
 * GET /api/projects
 * Get all projects for the current user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = await DatabaseService.getUserRole(userId);
    
    logger.info('📋 Fetching projects', { userId, userRole });
    
    let projects = [];
    
    if (userRole === 'admin' || userRole === 'superadmin') {
      // Admins get their own projects
      projects = await DatabaseService.getAdminProjects(userId);
    } else {
      // Regular users get projects they're invited to
      projects = await DatabaseService.getUserProjects(userId);
    }
    
    res.json({
      success: true,
      projects,
      total: projects.length,
      role: userRole
    });
  } catch (error) {
    logger.error('Failed to fetch projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

/**
 * POST /api/projects
 * Create a new project (admin only)
 */
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, url, description } = req.body;
    const adminId = req.user.id;
    
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: 'Project name and URL are required'
      });
    }
    
    logger.info('➕ Creating new project', { name, url, adminId });
    
    const project = await DatabaseService.createProject({
      name,
      url,
      description,
      admin_id: adminId
    });
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    logger.error('Failed to create project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

/**
 * GET /api/projects/:projectId
 * Get project details
 */
router.get('/:projectId', hasProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    logger.info('📋 Fetching project details', { projectId, userId: req.user.id });
    
    // Get project users
    const users = await DatabaseService.getProjectUsers(projectId);
    
    res.json({
      success: true,
      users,
      total: users.length
    });
  } catch (error) {
    logger.error('Failed to fetch project details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project details'
    });
  }
});

/**
 * PUT /api/projects/:projectId
 * Update project (admin only)
 */
router.put('/:projectId', isAdmin, hasProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, url, description } = req.body;
    
    logger.info('✏️ Updating project', { projectId, userId: req.user.id });
    
    const project = await DatabaseService.updateProject(projectId, {
      name,
      url,
      description
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    logger.error('Failed to update project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

/**
 * DELETE /api/projects/:projectId
 * Delete project (admin only)
 */
router.delete('/:projectId', isAdmin, hasProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    logger.info('🗑️ Deleting project', { projectId, userId: req.user.id });
    
    const deleted = await DatabaseService.deleteProject(projectId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

/**
 * POST /api/projects/:projectId/users
 * Invite a user to a project (admin only)
 */
router.post('/:projectId/users', isAdmin, hasProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;
    const invitedBy = req.user.id;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'User email is required'
      });
    }
    
    logger.info('👤 Inviting user to project', { projectId, email, invitedBy });
    
    // Find user by email
    const user = await DatabaseService.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email'
      });
    }
    
    // Invite user to project
    const invitation = await DatabaseService.inviteUserToProject(projectId, user.id, invitedBy);
    
    res.json({
      success: true,
      message: 'User invited to project successfully',
      invitation
    });
  } catch (error) {
    logger.error('Failed to invite user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invite user to project'
    });
  }
});

/**
 * DELETE /api/projects/:projectId/users/:userId
 * Remove a user from a project (admin only)
 */
router.delete('/:projectId/users/:userId', isAdmin, hasProjectAccess, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    
    logger.info('🚫 Removing user from project', { projectId, userId, removedBy: req.user.id });
    
    const removed = await DatabaseService.removeUserFromProject(projectId, userId);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'User not found in this project'
      });
    }
    
    res.json({
      success: true,
      message: 'User removed from project successfully'
    });
  } catch (error) {
    logger.error('Failed to remove user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove user from project'
    });
  }
});

/**
 * GET /api/projects/:projectId/users/:userId/permissions
 * Get module permissions for a user in a project
 */
router.get('/:projectId/users/:userId/permissions', isAdmin, hasProjectAccess, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    
    logger.info('📋 Fetching user permissions', { projectId, userId });
    
    const permissions = await DatabaseService.getModulePermissions(projectId, userId);
    
    res.json({
      success: true,
      permissions
    });
  } catch (error) {
    logger.error('Failed to fetch permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user permissions'
    });
  }
});

/**
 * PUT /api/projects/:projectId/users/:userId/permissions
 * Update module permissions for a user in a project (admin only)
 */
router.put('/:projectId/users/:userId/permissions', isAdmin, hasProjectAccess, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { modules } = req.body;
    
    if (!modules || !Array.isArray(modules)) {
      return res.status(400).json({
        success: false,
        error: 'Modules array is required'
      });
    }
    
    logger.info('✏️ Updating user permissions', { projectId, userId, modules });
    
    await DatabaseService.setModulePermissions(projectId, userId, modules);
    
    res.json({
      success: true,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update permissions'
    });
  }
});

export default router;
