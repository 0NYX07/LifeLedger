const { Obligation } = require('../models/Obligation');
const { calculateUrgency, evaluateMoneyLeak } = require('../services/obligation.service');

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

    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
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
 * Mark obligation as completed
 * PATCH /api/obligations/:id/complete
 */
const completeObligation = async (req, res, next) => {
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

    obligation.status = 'completed';
    obligation.completedAt = new Date();
    await obligation.save();

    const result = obligation.toJSON();
    result.urgency = calculateUrgency(obligation.dueDate, obligation.status);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Obligation marked as completed'
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

    obligation.status = 'cancelled';
    await obligation.save();

    const result = obligation.toJSON();
    result.urgency = calculateUrgency(obligation.dueDate, obligation.status);

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
 * Permanently delete an obligation
 * DELETE /api/obligations/:id
 */
const deleteObligation = async (req, res, next) => {
  try {
    const obligation = await Obligation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Obligation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Obligation deleted successfully'
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
  deleteObligation
};
