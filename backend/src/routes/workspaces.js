const express = require('express');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken, checkWorkspaceAccess } = require('../middleware/auth');
const { validateWorkspace, validateUUID, validatePagination } = require('../middleware/validation');
const activityService = require('../services/activityService');

const router = express.Router();

// Get user workspaces
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data: workspaces, error } = await supabaseAdmin
      .from('workspace_members')
      .select(`
        role,
        joined_at,
        workspaces (
          id,
          name,
          description,
          avatar_url,
          created_at,
          updated_at,
          users!workspaces_created_by_fkey (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', req.user.id)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const formattedWorkspaces = workspaces.map(item => ({
      ...item.workspaces,
      user_role: item.role,
      joined_at: item.joined_at,
      created_by: item.workspaces.users
    }));

    res.json({ workspaces: formattedWorkspaces });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// Get workspace details
router.get('/:workspaceId', 
  authenticateToken, 
  validateUUID('workspaceId'), 
  checkWorkspaceAccess('member'),
  async (req, res) => {
    try {
      const { workspaceId } = req.params;

      const { data: workspace, error } = await supabaseAdmin
        .from('workspaces')
        .select(`
          *,
          users!workspaces_created_by_fkey (
            id,
            full_name,
            avatar_url
          ),
          workspace_members (
            user_id,
            role,
            joined_at,
            users (
              id,
              full_name,
              email,
              avatar_url
            )
          ),
          projects (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('id', workspaceId)
        .single();

      if (error) throw error;

      const formattedWorkspace = {
        ...workspace,
        created_by: workspace.users,
        members: workspace.workspace_members.map(member => ({
          ...member.users,
          role: member.role,
          joined_at: member.joined_at
        })),
        user_role: req.workspaceRole
      };

      delete formattedWorkspace.users;
      delete formattedWorkspace.workspace_members;

      res.json({ workspace: formattedWorkspace });
    } catch (error) {
      console.error('Get workspace error:', error);
      res.status(500).json({ error: 'Failed to fetch workspace' });
    }
  }
);

// Create workspace
router.post('/', authenticateToken, validateWorkspace, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        name,
        description,
        created_by: req.user.id,
        avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name)}`
      })
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    // Add creator as owner
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: req.user.id,
        role: 'owner'
      });

    if (memberError) throw memberError;

    // Log activity
    await activityService.logActivity({
      workspace_id: workspace.id,
      user_id: req.user.id,
      action: 'workspace_created',
      details: { workspace_name: workspace.name }
    });

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Update workspace
router.put('/:workspaceId',
  authenticateToken,
  validateUUID('workspaceId'),
  checkWorkspaceAccess('admin'),
  validateWorkspace,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { name, description } = req.body;

      const { data: workspace, error } = await supabaseAdmin
        .from('workspaces')
        .update({
          name,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await activityService.logActivity({
        workspace_id: workspaceId,
        user_id: req.user.id,
        action: 'workspace_updated',
        details: { workspace_name: workspace.name }
      });

      res.json({
        message: 'Workspace updated successfully',
        workspace
      });
    } catch (error) {
      console.error('Update workspace error:', error);
      res.status(500).json({ error: 'Failed to update workspace' });
    }
  }
);

module.exports = router;