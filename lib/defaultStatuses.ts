import Status, { IStatus } from '@/models/Status';

export const DEFAULT_STATUSES = [
  {
    name: 'New',
    color: '#6366f1',
    order: 1,
    isDefault: true,
    isActive: true,
    whatsappMessage:
      'Hello {name}! 👋 Thank you for reaching out to *Reelman Production*. We specialize in premium wedding films & photography. We would love to learn more about your vision for {date}. When is a good time to connect?',
  },
  {
    name: 'Active',
    color: '#22c55e',
    order: 2,
    isDefault: true,
    isActive: true,
    whatsappMessage:
      'Hello {name}! 👋 Following up from *Reelman Production* regarding our discussions for your shoot on {date}. Please let us know if you have any questions or package customization requests!',
  },
  {
    name: 'Pending',
    color: '#f59e0b',
    order: 3,
    isDefault: true,
    isActive: true,
    whatsappMessage:
      'Hi {name}! 👋 We are currently holding your date ({date}) in our production schedule at *Reelman Production*. Would you like to confirm the booking so we can lock in our team?',
  },
  {
    name: 'Follow-up',
    color: '#8b5cf6',
    order: 4,
    isDefault: true,
    isActive: true,
    whatsappMessage:
      'Hello {name}! 👋 Just checking in from *Reelman Production*. We would love to capture your special moments on {date}. Let us know how you would like to proceed!',
  },
  {
    name: 'Confirmed',
    color: '#06b6d4',
    order: 5,
    isDefault: true,
    isActive: true,
    whatsappMessage:
      'Hi {name}! 🎉 We are delighted to confirm your booking with *Reelman Production* for {date}! Our crew is reserved and ready to create cinematic magic for you.',
  },
  {
    name: 'In Progress',
    color: '#3b82f6',
    order: 6,
    isDefault: true,
    isActive: true,
    whatsappMessage:
      'Hello {name}! 🎬 Our post-production & editing team is currently working on your footage at *Reelman Production*. We will share teasers/updates with you shortly!',
  },
  {
    name: 'Completed',
    color: '#10b981',
    order: 7,
    isDefault: true,
    isActive: true,
    whatsappMessage:
      'Hi {name}! ✨ Your deliverables from *Reelman Production* are complete! Thank you so much for choosing us to tell your story. It was an absolute pleasure working with you.',
  },
  {
    name: 'Payment Pending',
    color: '#f97316',
    order: 8,
    isDefault: true,
    isActive: true,
    whatsappMessage:
      'Hello {name}! 👋 A gentle reminder regarding the pending balance payment for your *Reelman Production* package. Please let us know once the transfer is done. Thank you!',
  },
  {
    name: 'Cancelled',
    color: '#ef4444',
    order: 9,
    isDefault: true,
    isActive: true,
    whatsappMessage:
      'Hello {name}. We have updated your event status as cancelled. If you ever need photography or filmmaking services in the future, *Reelman Production* is always here for you.',
  },
  {
    name: 'On Hold',
    color: '#6b7280',
    order: 10,
    isDefault: true,
    isActive: true,
    whatsappMessage:
      'Hello {name}! 👋 Your project with *Reelman Production* is currently placed on hold. Whenever you are ready to resume, simply reply to this message!',
  },
];

export async function ensureDefaultStatuses(): Promise<IStatus[]> {
  const count = await Status.countDocuments();
  if (count === 0) {
    await Status.insertMany(DEFAULT_STATUSES);
  }
  return Status.find({ isActive: true }).sort({ order: 1 });
}
