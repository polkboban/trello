const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateUUID } = require('../middleware/validation');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xlsx|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

router.post('/task/:taskId',
  authenticateToken,
  validateUUID('taskId'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { taskId } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { data: task, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select(`
          id,
          title,
          projects (
            workspace_id
          )
        `)
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const { data: membership } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', task.projects.workspace_id)
        .eq('user_id', req.user.id)
        .single();

      if (!membership) {
        return res.status(403).json({ error: 'Access denied to task' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const { data: attachment, error: attachmentError } = await supabaseAdmin
        .from('attachments')
        .insert({
          task_id: taskId,
          filename: req.file.originalname,
          file_url: fileUrl,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          uploaded_by: req.user.id
        })
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (attachmentError) throw attachmentError;

      // Emit socket event
      const io = req.app.get('socketio');
      io.to(`task_${taskId}`).emit('attachment_uploaded', {
        attachment: {
          ...attachment,
          uploaded_by: attachment.users
        },
        task_title: task.title
      });

      const formattedAttachment = {
        ...attachment,
        uploaded_by: attachment.users
      };
      delete formattedAttachment.users;

      res.status(201).json({
        message: 'File uploaded successfully',
        attachment: formattedAttachment
      });
    } catch (error) {
      console.error('Upload file error:', error);
      
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large' });
      }

      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);

router.delete('/:attachmentId',
  authenticateToken,
  validateUUID('attachmentId'),
  async (req, res) => {
    try {
      const { attachmentId } = req.params;

      const { data: attachment, error: attachmentError } = await supabaseAdmin
        .from('attachments')
        .select(`
          *,
          tasks (
            projects (
              workspace_id
            )
          )
        `)
        .eq('id', attachmentId)
        .single();

      if (attachmentError || !attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      const { data: membership } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', attachment.tasks.projects.workspace_id)
        .eq('user_id', req.user.id)
        .single();

      if (!membership) {
        return res.status(403).json({ error: 'Access denied to attachment' });
      }

      if (attachment.uploaded_by !== req.user.id && !['admin', 'owner'].includes(membership.role)) {
        return res.status(403).json({ error: 'Insufficient permissions to delete attachment' });
      }

      const uploadPath = process.env.UPLOAD_PATH || 'uploads/';
      const filePath = path.join(uploadPath, path.basename(attachment.file_url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const { error: deleteError } = await supabaseAdmin
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteError) throw deleteError;

      const io = req.app.get('socketio');
      io.to(`task_${attachment.task_id}`).emit('attachment_deleted', {
        attachment_id: attachmentId,
        filename: attachment.filename
      });

      res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
      console.error('Delete attachment error:', error);
      res.status(500).json({ error: 'Failed to delete attachment' });
    }
  }
);

module.exports = router;