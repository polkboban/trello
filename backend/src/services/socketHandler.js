const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');

const socketHandler = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.full_name} connected: ${socket.id}`);

    // Join user to their personal room for notifications
    socket.join(`user_${socket.user.id}`);

    // Handle joining workspace rooms
    socket.on('join_workspace', async (workspaceId) => {
      try {
        // Verify user has access to workspace
        const { data: membership } = await supabaseAdmin
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', socket.user.id)
          .single();

        if (membership) {
          socket.join(`workspace_${workspaceId}`);
          console.log(`User ${socket.user.full_name} joined workspace ${workspaceId}`);
        }
      } catch (error) {
        console.error('Error joining workspace:', error);
      }
    });

    // Handle joining project rooms
    socket.on('join_project', async (projectId) => {
      try {
        // Verify user has access to project via workspace
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('workspace_id')
          .eq('id', projectId)
          .single();

        if (project) {
          const { data: membership } = await supabaseAdmin
            .from('workspace_members')
            .select('role')
            .eq('workspace_id', project.workspace_id)
            .eq('user_id', socket.user.id)
            .single();

          if (membership) {
            socket.join(`project_${projectId}`);
            console.log(`User ${socket.user.full_name} joined project ${projectId}`);
          }
        }
      } catch (error) {
        console.error('Error joining project:', error);
      }
    });

    // Handle joining task rooms
    socket.on('join_task', async (taskId) => {
      try {
        // Verify user has access to task via project/workspace
        const { data: task } = await supabaseAdmin
          .from('tasks')
          .select(`
            id,
            projects (
              workspace_id
            )
          `)
          .eq('id', taskId)
          .single();

        if (task) {
          const { data: membership } = await supabaseAdmin
            .from('workspace_members')
            .select('role')
            .eq('workspace_id', task.projects.workspace_id)
            .eq('user_id', socket.user.id)
            .single();

          if (membership) {
            socket.join(`task_${taskId}`);
            console.log(`User ${socket.user.full_name} joined task ${taskId}`);
          }
        }
      } catch (error) {
        console.error('Error joining task:', error);
      }
    });

    // Handle leaving rooms
    socket.on('leave_workspace', (workspaceId) => {
      socket.leave(`workspace_${workspaceId}`);
      console.log(`User ${socket.user.full_name} left workspace ${workspaceId}`);
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(`project_${projectId}`);
      console.log(`User ${socket.user.full_name} left project ${projectId}`);
    });

    socket.on('leave_task', (taskId) => {
      socket.leave(`task_${taskId}`);
      console.log(`User ${socket.user.full_name} left task ${taskId}`);
    });

    // Handle typing indicators for comments
    socket.on('typing_start', (data) => {
      socket.to(`task_${data.taskId}`).emit('user_typing', {
        user: socket.user,
        taskId: data.taskId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`task_${data.taskId}`).emit('user_stopped_typing', {
        user: socket.user,
        taskId: data.taskId
      });
    });

    // Handle user presence
    socket.on('user_active', () => {
      socket.broadcast.emit('user_online', {
        user: socket.user,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.full_name} disconnected: ${reason}`);
      
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', {
        user: socket.user,
        timestamp: new Date().toISOString()
      });
    });
  });
};

module.exports = socketHandler;