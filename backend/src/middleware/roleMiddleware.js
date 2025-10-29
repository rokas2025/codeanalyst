import { DatabaseService } from '../services/DatabaseService.js';
import logger from '../utils/logger.js';

/**
 * Middleware to check if user is a superadmin
 */
export const isSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const role = await DatabaseService.getUserRole(userId);
    
    if (role !== 'superadmin') {
      logger.warn(`Unauthorized superadmin access attempt by user ${userId}`);
      return res.status(403).json({
        success: false,
        error: 'Superadmin access required'
      });
    }

    next();
  } catch (error) {
    logger.error('Superadmin check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify permissions'
    });
  }
};

/**
 * Middleware to check if user is an admin (superadmin or admin role)
 */
export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const role = await DatabaseService.getUserRole(userId);
    
    if (role !== 'superadmin' && role !== 'admin') {
      logger.warn(`Unauthorized admin access attempt by user ${userId}`);
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    req.user.role = role; // Attach role to request
    next();
  } catch (error) {
    logger.error('Admin check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify permissions'
    });
  }
};

/**
 * Middleware to check if user has access to a specific project
 * Project ID should be in req.params.projectId or req.body.projectId
 */
export const hasProjectAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const projectId = req.params.projectId || req.body.projectId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID required'
      });
    }

    // Check if user has access to this project
    const hasAccess = await DatabaseService.checkProjectAccess(userId, projectId);
    
    if (!hasAccess) {
      logger.warn(`Unauthorized project access attempt by user ${userId} for project ${projectId}`);
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project'
      });
    }

    next();
  } catch (error) {
    logger.error('Project access check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify project access'
    });
  }
};

/**
 * Middleware to check if user has access to a specific module within a project
 * Requires projectId and moduleName in request
 */
export const hasModuleAccess = (moduleName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // If no project is selected, allow access (manual URL entry mode)
      if (!projectId) {
        return next();
      }

      // Check if user has module permission
      const hasPermission = await DatabaseService.checkModulePermission(userId, projectId, moduleName);
      
      if (!hasPermission) {
        logger.warn(`Unauthorized module access attempt by user ${userId} for module ${moduleName} in project ${projectId}`);
        return res.status(403).json({
          success: false,
          error: `You do not have access to the ${moduleName} module for this project`,
          message: 'Contact your admin to request access'
        });
      }

      next();
    } catch (error) {
      logger.error('Module access check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify module access'
      });
    }
  };
};

/**
 * Middleware to check if user account is active
 * This should be used early in the auth chain
 */
export const isActiveUser = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await DatabaseService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.is_active) {
      logger.warn(`Inactive user login attempt: ${userId}`);
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated',
        message: 'Please contact support for assistance'
      });
    }

    if (user.pending_approval) {
      logger.warn(`Pending approval user login attempt: ${userId}`);
      return res.status(403).json({
        success: false,
        error: 'Your account is pending approval',
        message: 'Please wait for an administrator to approve your account'
      });
    }

    next();
  } catch (error) {
    logger.error('Active user check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify account status'
    });
  }
};

export default {
  isSuperAdmin,
  isAdmin,
  hasProjectAccess,
  hasModuleAccess,
  isActiveUser
};

