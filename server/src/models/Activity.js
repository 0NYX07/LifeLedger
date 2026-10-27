const mongoose = require('mongoose');

const ACTIONS = [
  'created',
  'updated',
  'completed',
  'cancelled',
  'deleted',
  'attachment_uploaded',
  'attachment_deleted',
  'recurrence_generated'
];

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner userId is required'],
      index: true
    },
    action: {
      type: String,
      enum: {
        values: ACTIONS,
        message: '{VALUE} is not a valid activity action'
      },
      required: true
    },
    resourceType: {
      type: String,
      enum: ['obligation', 'attachment'],
      default: 'obligation'
    },
    resourceId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

activitySchema.index({ userId: 1, createdAt: -1 });

activitySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = {
  Activity,
  ACTIONS
};
