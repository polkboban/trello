const { validationResult, body, param, query } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const validateWorkspace = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be under 500 characters'),
  handleValidationErrors
];

const validateProject = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be under 1000 characters'),
  body('workspace_id').isUUID().withMessage('Valid workspace ID required'),
  handleValidationErrors
];

const validateTask = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Invalid status'),
  body('due_date').optional().isISO8601().withMessage('Invalid due date format'),
  body('project_id').isUUID().withMessage('Valid project ID required'),
  handleValidationErrors
];

const validateComment = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1-2000 characters'),
  body('task_id').isUUID().withMessage('Valid task ID required'),
  handleValidationErrors
];

const validateUUID = (paramName) => [
  param(paramName).isUUID().withMessage(`Valid ${paramName} required`),
  handleValidationErrors
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateWorkspace,
  validateProject,
  validateTask,
  validateComment,
  validateUUID,
  validatePagination
};