const express = require('express');
const router = express.Router();
const obligationController = require('../controllers/obligation.controller');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../config/storage');
const {
  obligationCreateValidator,
  obligationUpdateValidator,
  paramIdValidator
} = require('../middleware/validate');

// All obligation routes are protected by authentication middleware
router.use(authenticate);

// Multer error handling wrapper
const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds maximum limit of 5MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    next();
  });
};

router.get('/', obligationController.listObligations);
router.post('/', obligationCreateValidator, obligationController.createObligation);
router.get('/:id', paramIdValidator, obligationController.getObligation);
router.patch('/:id', obligationUpdateValidator, obligationController.updateObligation);
router.patch('/:id/complete', paramIdValidator, obligationController.completeObligation);
router.patch('/:id/cancel', paramIdValidator, obligationController.cancelObligation);
router.delete('/:id', paramIdValidator, obligationController.deleteObligation);

// Feature A: Document attachments routes
router.post('/:id/attachments', paramIdValidator, handleUpload, obligationController.uploadAttachment);
router.get('/:id/attachments/:attachmentId/view', paramIdValidator, obligationController.viewAttachment);
router.get('/:id/attachments/:attachmentId/download', paramIdValidator, obligationController.downloadAttachment);
router.delete('/:id/attachments/:attachmentId', paramIdValidator, obligationController.deleteAttachment);

module.exports = router;
