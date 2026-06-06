// DDSE Notification domain types

export type NotificationType = 'alert' | 'info' | 'warning' | 'success';
export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Notification {
  id:          string;
  recipientId: string;
  type:        NotificationType;
  title:       string;
  body:        string;
  entityType:  string | null;
  entityId:    string | null;
  priority:    NotificationPriority;
  read:        boolean;
  readAt:      string | null;
  createdAt:   string;
}
