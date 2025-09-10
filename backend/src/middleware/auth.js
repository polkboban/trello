const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const checkWorkspaceAccess = (requiredRole = 'member') => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.workspaceId || req.body.workspaceId;
      
      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID required' });
      }

      const { data: membership, error } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !membership) {
        return res.status(403).json({ error: 'Access denied to workspace' });
      }

      // Role hierarchy: guest < member < admin < owner
      const roleHierarchy = { guest: 0, member: 1, admin: 2, owner: 3 };
      const userRoleLevel = roleHierarchy[membership.role];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.workspaceRole = membership.role;
      next();
    } catch (error) {
      console.error('Workspace access check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = {
  authenticateToken,
  checkWorkspaceAccess
};