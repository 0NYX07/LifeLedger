const express = require('express');
const router = express.Router();
const obligationController = require('../controllers/obligation.controller');
const { authenticate } = require('../middleware/auth');
const {
  obligationCreateValidator,
  obligationUpdateValidator,
  paramIdValidator
} = require('../middleware/validate');

// All obligation routes are protected by authentication middleware
router.use(authenticate);

router.get('/', obligationController.listObligations);
router.post('/', obligationCreateValidator, obligationController.createObligation);
router.get('/:id', paramIdValidator, obligationController.getObligation);
router.patch('/:id', obligationUpdateValidator, obligationController.updateObligation);
router.patch('/:id/complete', paramIdValidator, obligationController.completeObligation);
router.patch('/:id/cancel', paramIdValidator, obligationController.cancelObligation);
router.delete('/:id', paramIdValidator, obligationController.deleteObligation);

module.exports = router;
