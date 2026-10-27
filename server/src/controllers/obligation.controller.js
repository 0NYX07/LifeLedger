const fs = require('fs');
const path = require('path');
const { Obligation } = require('../models/Obligation');
const { calculateUrgency, evaluateMoneyLeak } = require('../services/obligation.service');
const { logActivity } = require('../services/activity.service');
const { createLifecycleNotification } = require('../services/notification.service');
const { computeNextDueDate } = require('../utils/recurrence');
const { deleteFile, UPLOAD_ROOT } = require('../config/storage');

// Allowlists for creating and updating obligations
const ALLOWED_FIELDS = [
  'title',
  'description',
  'category',
  'dueDate',
  'amount',
  'currency',
  'priority',
  'status',
  'recurrence',
  'notes'
];

/**
 * List owned obligations with optional search, category, status, urgency, and sort filters
 * GET /api/obligations
 */
const listObligations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, category, status, urgency, sort = 'dueDate' } = req.query;

    // Strict user ownership filter
    const query = { userId };

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { notes: searchRegex }
      ];
    }

    // Build sort
    let sortObj = { dueDate: 1 };
    if (sort === '-dueDate') sortObj = { dueDate: -1 };
    else if (sort === 'amount') sortObj = { amount: 1 };
    else if (sort === '-amount') sortObj = { amount: -1 };
    else if (sort === 'priority') sortObj = { priority: -1 };
    else if (sort === 'createdAt') sortObj = { createdAt: -1 };

    const obligations = await Obligation.find(query).sort(sortObj);

    // Enhance records with calculated urgency
    let results = obligations.map((doc) => {
      const obj = doc.toJSON();
      obj.urgency = calculateUrgency(doc.dueDate, doc.status);
      return obj;
    });

    // If urgency filter is specified, filter in memory
    if (urgency) {
      results = results.filter((item) => item.urgency === urgency);
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new obligation owned by authenticated user
 * POST /api/obligations
 */
const createObligation = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Pick only allowlisted fields to prevent mass assignment
    const payload = { userId };
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    });

    // Clean up empty amount strings if sent
    if (payload.amount === '' || payload.amount === undefined) {
      payload.amount = null;
    }

    const obligation = await Obligation.create(payload);
    const result = obligation.toJSON();
    result.urgency = calculateUrgency(obligation.dueDate, obligation.status);

    // Record activity
    await logActivity(userId, {
      action: 'created',
      resourceType: 'obligation',
      resourceId: obligation._id,
      title: obligation.title,
      description: `Created obligation "${obligation.title}"`,
      details: {
        category: obligation.category,
        amount: obligation.amount,
        recurrence: obligation.recurrence
      }
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Obligation created successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve single owned obligation by ID
 * GET /api/obligations/:id
 */
const getObligation = async (req, res, next) => {
  try {
    const obligation = await Obligation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Obligation not found'
      });
    }

    const result = obligation.toJSON();
    result.urgency = calculateUrgency(obligation.dueDate, obligation.status);
    result.moneyLeak = evaluateMoneyLeak(obligation);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update allowed fields of an owned obligation
 * PATCH /api/obligations/:id
 */
const updateObligation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const obligation = await Obligation.findOne({
      _id: req.params.id,
      userId
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Obligation not found'
      });
    }

    const originalRecurrence = obligation.recurrence;
    let recurrenceChanged = false;

    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'recurrence' && req.body[field] !== originalRecurrence) {
          recurrenceChanged = true;
        }
        if (field === 'amount' && (req.body[field] === '' || req.body[field] === null)) {
          obligation[field] = null;
        } else {
          obligation[field] = req.body[field];
        }
      }
    });

    // If status changed to completed, set completedAt
    if (req.body.status === 'completed' && !obligation.completedAt) {
      obligation.completedAt = new Date();
    } else if (req.body.status && req.body.status !== 'completed') {
      obligation.completedAt = null;
    }

    await obligation.save();

    const result = obligation.toJSON();
    result.urgency = calculateUrgency(obligation.dueDate, obligation.status);

    // Record activity
    await logActivity(userId, {
      action: recurrenceChanged ? 'recurrence_changed' : 'updated',
      resourceType: 'obligation',
      resourceId: obligation._id,
      title: obligation.title,
      description: recurrenceChanged
        ? `Changed recurrence of "${obligation.title}" from ${originalRecurrence} to ${obligation.recurrence}`
        : `Updated details for "${obligation.title}"`,
      details: {
        recurrence: obligation.recurrence,
        amount: obligation.amount
      }
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Obligation updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark obligation as completed and schedule next recurrence if applicable
 * PATCH /api/obligations/:id/complete
 */
const completeObligation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const obligation = await Obligation.findOne({
      _id: req.params.id,
      userId
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Obligation not found'
      });
    }

    obligation.status = 'completed';
    obligation.completedAt = new Date();
    await obligation.save();

    const result = obligation.toJSON();
    result.urgency = calculateUrgency(obligation.dueDate, obligation.status);

    // Record completion activity
    await logActivity(userId, {
      action: 'completed',
      resourceType: 'obligation',
      resourceId: obligation._id,
      title: obligation.title,
      description: `Marked "${obligation.title}" as completed`,
      details: { completedAt: obligation.completedAt }
    });

    // Feature B: Check if obligation has recurring schedule (monthly or yearly)
    let nextOccurrence = null;
    if (obligation.recurrence && obligation.recurrence !== 'none') {
      const nextDueDate = computeNextDueDate(obligation.dueDate, obligation.recurrence);
      if (nextDueDate) {
        // Idempotency: avoid duplicate next occurrences
        const existingNext = await Obligation.findOne({
          userId,
          title: obligation.title,
          status: 'active',
          recurrence: obligation.recurrence,
          dueDate: nextDueDate
        });

        if (!existingNext) {
          nextOccurrence = await Obligation.create({
            userId,
            title: obligation.title,
            description: obligation.description,
            category: obligation.category,
            dueDate: nextDueDate,
            amount: obligation.amount,
            currency: obligation.currency,
            priority: obligation.priority,
            status: 'active',
            recurrence: obligation.recurrence,
            notes: obligation.notes
          });

          // Record activity for next scheduled occurrence
          await logActivity(userId, {
            action: 'recurrence_generated',
            resourceType: 'obligation',
            resourceId: nextOccurrence._id,
            title: nextOccurrence.title,
            description: `Automatically scheduled next ${obligation.recurrence} cycle for "${nextOccurrence.title}" due ${nextDueDate.toISOString().split('T')[0]}`,
            details: { recurrence: obligation.recurrence, dueDate: nextDueDate }
          });

          // Trigger lifecycle in-app notification
          await createLifecycleNotification(userId, {
            type: 'lifecycle',
            title: `Next Recurrence Scheduled: ${nextOccurrence.title}`,
            message: `"${nextOccurrence.title}" was marked complete, and the next cycle is scheduled for ${nextDueDate.toISOString().split('T')[0]}.`,
            obligationId: nextOccurrence._id,
            dedupSuffix: nextDueDate.toISOString().split('T')[0]
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: result,
      nextOccurrence: nextOccurrence ? nextOccurrence.toJSON() : null,
      message: nextOccurrence
        ? 'Obligation completed and next recurrence scheduled'
        : 'Obligation marked as completed'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark obligation as cancelled
 * PATCH /api/obligations/:id/cancel
 */
const cancelObligation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const obligation = await Obligation.findOne({
      _id: req.params.id,
      userId
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Obligation not found'
      });
    }

    obligation.status = 'cancelled';
    await obligation.save();

    const result = obligation.toJSON();
    result.urgency = calculateUrgency(obligation.dueDate, obligation.status);

    // Record activity
    await logActivity(userId, {
      action: 'cancelled',
      resourceType: 'obligation',
      resourceId: obligation._id,
      title: obligation.title,
      description: `Cancelled obligation "${obligation.title}"`,
      details: { status: 'cancelled' }
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Obligation cancelled'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Permanently delete an obligation and clean up associated physical files
 * DELETE /api/obligations/:id
 */
const deleteObligation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const obligation = await Obligation.findOne({
      _id: req.params.id,
      userId
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Obligation not found'
      });
    }

    // Clean up any attachment files from disk
    if (obligation.attachments && obligation.attachments.length > 0) {
      for (const att of obligation.attachments) {
        if (att.storagePath) {
          const resolvedPath = path.resolve(att.storagePath);
          if (resolvedPath.startsWith(path.resolve(UPLOAD_ROOT))) {
            await deleteFile(resolvedPath);
          }
        }
      }
    }

    await Obligation.deleteOne({ _id: obligation._id });

    // Record activity with preserved title and details
    await logActivity(userId, {
      action: 'deleted',
      resourceType: 'obligation',
      resourceId: obligation._id,
      title: obligation.title,
      description: `Permanently deleted obligation "${obligation.title}"`,
      details: { category: obligation.category, amount: obligation.amount }
    });

    res.status(200).json({
      success: true,
      message: 'Obligation deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Feature A: Secure Document Attachments
 * Upload an attachment to an owned obligation
 * POST /api/obligations/:id/attachments
 */
const uploadAttachment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const obligationId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file was rejected by format filter'
      });
    }

    const obligation = await Obligation.findOne({
      _id: obligationId,
      userId
    });

    if (!obligation) {
      // Clean up the temporarily written file if the target obligation does not exist
      await deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Obligation not found'
      });
    }

    const attachmentData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,
      url: `/api/obligations/${obligation._id}/attachments`,
      uploadedAt: new Date()
    };

    obligation.attachments.push(attachmentData);
    await obligation.save();

    const createdAttachment = obligation.attachments[obligation.attachments.length - 1];

    // Log activity
    await logActivity(userId, {
      action: 'attachment_uploaded',
      resourceType: 'attachment',
      resourceId: createdAttachment._id,
      title: obligation.title,
      description: `Attached document "${req.file.originalname}" to "${obligation.title}"`,
      details: {
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });

    res.status(201).json({
      success: true,
      data: createdAttachment.toJSON(),
      message: 'Document attached successfully'
    });
  } catch (err) {
    if (req.file && req.file.path) {
      await deleteFile(req.file.path);
    }
    next(err);
  }
};

/**
 * Feature A: View an attachment inline
 * GET /api/obligations/:id/attachments/:attachmentId/view
 */
const viewAttachment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: obligationId, attachmentId } = req.params;

    const obligation = await Obligation.findOne({
      _id: obligationId,
      userId
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Obligation not found'
      });
    }

    const attachment = obligation.attachments.id(attachmentId);
    if (!attachment || !attachment.storagePath || !fs.existsSync(attachment.storagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Attachment file not found'
      });
    }

    const resolvedPath = path.resolve(attachment.storagePath);
    if (!resolvedPath.startsWith(path.resolve(UPLOAD_ROOT))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: invalid storage path'
      });
    }

    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalName)}"`);
    res.sendFile(resolvedPath);
  } catch (err) {
    next(err);
  }
};

/**
 * Feature A: Download an attachment
 * GET /api/obligations/:id/attachments/:attachmentId/download
 */
const downloadAttachment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: obligationId, attachmentId } = req.params;

    const obligation = await Obligation.findOne({
      _id: obligationId,
      userId
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Obligation not found'
      });
    }

    const attachment = obligation.attachments.id(attachmentId);
    if (!attachment || !attachment.storagePath || !fs.existsSync(attachment.storagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Attachment file not found'
      });
    }

    const resolvedPath = path.resolve(attachment.storagePath);
    if (!resolvedPath.startsWith(path.resolve(UPLOAD_ROOT))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: invalid storage path'
      });
    }

    res.download(resolvedPath, attachment.originalName);
  } catch (err) {
    next(err);
  }
};

/**
 * Feature A: Delete an attachment without deleting the parent obligation
 * DELETE /api/obligations/:id/attachments/:attachmentId
 */
const deleteAttachment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: obligationId, attachmentId } = req.params;

    const obligation = await Obligation.findOne({
      _id: obligationId,
      userId
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Obligation not found'
      });
    }

    const attachment = obligation.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Clean up physical file on disk
    if (attachment.storagePath) {
      const resolvedPath = path.resolve(attachment.storagePath);
      if (resolvedPath.startsWith(path.resolve(UPLOAD_ROOT))) {
        await deleteFile(resolvedPath);
      }
    }

    const originalName = attachment.originalName;
    obligation.attachments.pull(attachmentId);
    await obligation.save();

    // Log activity
    await logActivity(userId, {
      action: 'attachment_deleted',
      resourceType: 'attachment',
      resourceId: attachmentId,
      title: obligation.title,
      description: `Removed document "${originalName}" from "${obligation.title}"`,
      details: { filename: originalName }
    });

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listObligations,
  createObligation,
  getObligation,
  updateObligation,
  completeObligation,
  cancelObligation,
  deleteObligation,
  uploadAttachment,
  viewAttachment,
  downloadAttachment,
  deleteAttachment
};
