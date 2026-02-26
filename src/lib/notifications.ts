/**
 * In-memory notification store for approval workflow notifications.
 * In production, this would be backed by the database.
 */

export interface Notification {
  id: string;
  type: "approval" | "denial" | "request" | "info";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

let nextNotifId = 1;

const notifications: Notification[] = [
  {
    id: "notif-1",
    type: "request",
    title: "New Access Request",
    message: "James Patel requested access to SG-Engineering-Admin",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-2",
    type: "approval",
    title: "Access Approved",
    message: "Anna Lindberg's request for SG-Lab-Instruments-Admin was approved",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    type: "info",
    title: "License Warning",
    message: "Adobe Creative Cloud is at 80% seat capacity (24/30)",
    read: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

export function getNotifications(): Notification[] {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getUnreadCount(): number {
  return notifications.filter((n) => !n.read).length;
}

export function markAsRead(id: string): boolean {
  const notif = notifications.find((n) => n.id === id);
  if (!notif) return false;
  notif.read = true;
  return true;
}

export function markAllAsRead(): void {
  notifications.forEach((n) => (n.read = true));
}

export function addNotification(
  data: Omit<Notification, "id" | "read" | "createdAt">
): Notification {
  const notif: Notification = {
    ...data,
    id: `notif-${++nextNotifId}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notif);
  // Emit to SSE listeners
  emitNotification(notif);
  return notif;
}

// SSE event emitter
type NotifListener = (notif: Notification) => void;
const listeners: Set<NotifListener> = new Set();

export function subscribeNotifications(listener: NotifListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitNotification(notif: Notification) {
  listeners.forEach((listener) => listener(notif));
}
