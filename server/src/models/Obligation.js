const mongoose = require('mongoose');

const CATEGORIES = [
  'subscription',
  'bill',
  'purchase',
  'return-window',
  'warranty',
  'insurance',
  'document-renewal',
  'custom'
];

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['active', 'completed', 'cancelled'];
const RECURRENCES = ['none', 'monthly', 'yearly'];

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const obligationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner userId is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a supported category'
      },
      default: 'custom'
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    amount: {
      type: Number,
      min: [0, 'Amount must be non-negative'],
      default: null
    },
    currency: {
      type: String,
      trim: true,
      default: 'INR'
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITIES,
        message: '{VALUE} is not a valid priority'
      },
      default: 'medium'
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: '{VALUE} is not a valid status'
      },
      default: 'active'
    },
    recurrence: {
      type: String,
      enum: {
        values: RECURRENCES,
        message: '{VALUE} is not a valid recurrence interval'
      },
      default: 'none'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters']
    },
    attachments: [attachmentSchema],
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for user-scoped queries as specified in architecture.md
obligationSchema.index({ userId: 1, dueDate: 1 });
obligationSchema.index({ userId: 1, status: 1 });
obligationSchema.index({ userId: 1, category: 1 });

obligationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Obligation = mongoose.model('Obligation', obligationSchema);

module.exports = {
  Obligation,
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  RECURRENCES
};
