# HoopsIQ: Notifications & Engagement System

This document details the centralized notification and engagement engine for HoopsIQ. It governs how the system communicates with athletes, coaches, and parents across in-app, email, and push channels, balancing retention-driving nudges with respect for user attention.

## 1. Notification Taxonomy & Channel Matrix

Not all notifications are created equal. HoopsIQ categorizes alerts into three tiers, dictating their default delivery channels.

*   **Transactional (High Priority):** Time-sensitive or critical account events.
    *   *Examples:* Payment failed, Booking confirmed/canceled, Live event starting in 15m, Discount entitlement revoked.
    *   *Channels:* In-App + Email (always on, cannot be disabled). Push (if enabled).
*   **Behavioral (Medium Priority):** Actions taken by other users or the system that directly affect the recipient.
    *   *Examples:* Coach assigned new film, AI feedback ready, Coach commented on upload, Film assignment due tomorrow.
    *   *Channels:* In-App (always on). Email (opt-out available). Push (opt-out available).
*   **Engagement/Marketing (Low Priority):** System-generated nudges designed to drive retention.
    *   *Examples:* Daily WOD reminder, Streak risk warning, Achievement unlocked, Class replay available.
    *   *Channels:* In-App (always on). Email (opt-out available, defaults to weekly digest). Push (opt-out available).

## 2. In-App Inbox Model

The in-app Notification Center (the "bell" icon) serves as the primary chronological feed of activity.

*   **Read/Unread State:** Unread notifications have a distinct background color (e.g., `bg-zinc-900`) and a blue dot indicator. Clicking a notification marks it as read and immediately routes the user to the relevant deep-link (e.g., `/film/player/clips/[clipId]`).
*   **Archive:** Users can archive notifications to clear their inbox without deleting the underlying `DomainEvent`. Archived notifications are moved to a separate tab or hidden entirely.
*   **Snooze:** For behavioral alerts (e.g., "Film assignment due"), users can swipe to snooze the alert for 24 hours. The notification is temporarily hidden and re-injected into the feed at the requested time.

## 3. Delivery Channel Model & Provider Strategy

HoopsIQ uses a multi-channel delivery architecture, orchestrated by a central background worker (e.g., Inngest or a custom Node/Redis queue) to ensure reliability and prevent blocking the main web threads.

*   **In-App:** Powered by the database (`Notification` table). Real-time updates can be pushed to the client via Server-Sent Events (SSE) or optimistic polling (SWR/React Query).
*   **Email:** **Resend** is the recommended provider. It offers a modern React-based templating engine (`@react-email/components`), excellent deliverability, and native Next.js integration. It is superior to legacy providers like SendGrid for modern stack architectures.
*   **Push (Placeholder):** To be implemented via Firebase Cloud Messaging (FCM) or Apple Push Notification service (APNs) when the React Native mobile apps are built. The backend schema supports push tokens per device.
*   **SMS (Placeholder):** Reserved strictly for ultra-high-priority transactional alerts (e.g., last-minute 1:1 booking cancellation by an expert) via Twilio.

## 4. Preference Model & COPPA Rules

A granular preference model prevents notification fatigue and ensures compliance with youth privacy regulations (COPPA).

*   **Per-Category Opt-In/Out:** Users can toggle email and push notifications individually for Behavioral and Engagement categories via `/(app)/settings/notifications`. Transactional alerts cannot be disabled.
*   **Quiet Hours:** A critical feature for athletes. Users can define a window (e.g., 10 PM - 7 AM) during which all non-transactional push notifications are held in a queue and delivered as a single digest the next morning.
*   **Parent vs. Athlete Preferences (Minors):** For athletes under 13 (or 18, depending on org policy), the system enforces a "Parent-in-the-Loop" routing rule. Any Behavioral notification involving direct communication (e.g., Coach commented on upload, Expert 1:1 booking confirmed) is automatically cc'd to the linked `ParentProfile`'s email, regardless of the minor's notification preferences.

## 5. Trigger & Event Mapping (The Outbox Pattern)

HoopsIQ relies on the `DomainEvent` table (the Outbox Pattern) to trigger notifications reliably, decoupling the core transaction from the delivery mechanism.

| Trigger Event | DomainEvent Type | Target Audience | Default Channels | Deep-Link Destination |
| :--- | :--- | :--- | :--- | :--- |
| Coach assigns film | `FILM_ASSIGNED` | Athlete | In-App, Push | `/(film)/player/inbox` |
| AI analysis completes | `AI_FEEDBACK_READY` | Athlete | In-App, Push | `/(player)/uploads/[id]` |
| Coach comments on clip | `COACH_COMMENTED` | Athlete (+ Parent if minor) | In-App, Email, Push | `/(film)/player/clips/[clipId]?t=[timestamp]` |
| Live event starting | `LIVE_STARTING_15M` | Enrolled Athlete | In-App, Push, Email | `/(live)/[eventId]/room` |
| Stripe sub fails | `PAYMENT_FAILED` | Payer (Parent/Athlete/Coach) | In-App (Banner), Email | `/(app)/settings/billing` |
| 50% discount granted | `DISCOUNT_GRANTED` | Athlete | In-App, Email | `/(player)/onboarding` or `/settings/billing` |

## 6. Retention-Oriented Engagement Recommendations

Notifications are a powerful tool for driving Daily Active Users (DAU) and reducing churn, provided they offer genuine value.

*   **Streak-Save Nudges:** If an athlete has a 5-day workout streak but hasn't logged activity by 6 PM, a push notification fires: "Keep the fire alive 🔥. 15 minutes of ball-handling is all it takes to hit Day 6."
*   **Comeback Offers:** If a user cancels their `Player Core` subscription, an automated email sequence begins 30 days later, offering a "Welcome Back" 20% discount on their first month.
*   **Milestone Celebrations:** Reaching Level 10 or completing a Skill Track triggers a celebratory in-app modal with confetti and a shareable social graphic, reinforcing their progress.
*   **Weekly Recap Email:** Sent every Sunday evening. Summarizes total XP earned, drills completed, and film watched, comparing their effort to the team average (if applicable) to foster healthy competition.

## 7. Schema Confirmations

Building on the canonical schema (Prompt 3), the notification system requires the following models:

*   `Notification`: The core inbox item (`id`, `userId`, `type: TRANSACTIONAL | BEHAVIORAL | ENGAGEMENT`, `title`, `message`, `actionUrl`, `isRead`, `isArchived`, `createdAt`).
*   `NotificationPreference`: User settings (`id`, `userId`, `emailBehavioral`, `emailEngagement`, `pushBehavioral`, `pushEngagement`, `quietHoursStart`, `quietHoursEnd`).
*   `NotificationChannel`: Device tokens (`id`, `userId`, `provider: APNS | FCM`, `token`, `lastUsedAt`).

## 8. High-Fidelity Next.js Scaffolding

Below is the foundational code for the Notifications engine, including the in-app Notification Center and the API route for fetching/managing notifications.

### `src/components/notifications/notification-center.tsx` (In-App Inbox)

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CheckCircleIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markNotificationRead, archiveNotification } from "@/app/actions/notifications";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: "TRANSACTIONAL" | "BEHAVIORAL" | "ENGAGEMENT";
  title: string;
  message: string;
  actionUrl: string;
  isRead: boolean;
  createdAt: string;
};

export function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // In a real app, this would use SWR or React Query with a polling interval,
  // or listen to Server-Sent Events (SSE) for real-time updates.
  useEffect(() => {
    async function fetchNotifications() {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    }
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      // Optimistic UI update
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      await markNotificationRead(notification.id);
    }
    setIsOpen(false);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering the click handler
    setNotifications(prev => prev.filter(n => n.id !== id));
    await archiveNotification(id);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-2xl border-zinc-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h4 className="font-heading uppercase tracking-tight text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <CheckCircleIcon className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">You're all caught up.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-4 border-b border-zinc-100 cursor-pointer hover:bg-zinc-50 transition-colors relative group",
                    !notification.isRead ? "bg-amber-50/30" : ""
                  )}
                >
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-sm font-semibold pr-6">{notification.title}</h5>
                    <button 
                      onClick={(e) => handleArchive(e, notification.id)}
                      className="text-zinc-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Archive notification"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-[10px] text-zinc-400 mt-2">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-2 border-t border-zinc-100 text-center">
          <Button variant="link" size="sm" className="text-xs w-full" onClick={() => router.push('/settings/notifications')}>
            Notification Settings
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### `src/app/actions/notifications.ts` (Server Actions)

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(notificationId: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.notification.update({
    where: { id: notificationId, userId },
    data: { isRead: true }
  });
}

export async function archiveNotification(notificationId: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.notification.update({
    where: { id: notificationId, userId },
    data: { isArchived: true }
  });
}

export async function updateNotificationPreferences(data: { emailBehavioral: boolean, pushBehavioral: boolean }) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data }
  });
  
  revalidatePath('/settings/notifications');
}
```

### `src/emails/templates/transactional.tsx` (Resend Email Template Stub)

```tsx
import { Html, Head, Preview, Body, Container, Section, Text, Button, Img } from '@react-email/components';

interface TransactionalEmailProps {
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
}

export default function TransactionalEmail({ title, message, actionText, actionUrl }: TransactionalEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{ margin: '0 auto', padding: '20px 0 48px', width: '580px' }}>
          <Section style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
            <Img src="https://hoopsiq.com/logo.png" width="40" height="40" alt="HoopsIQ" style={{ marginBottom: '24px' }} />
            <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#18181b', margin: '0 0 16px', textTransform: 'uppercase' }}>
              {title}
            </Text>
            <Text style={{ fontSize: '16px', color: '#52525b', lineHeight: '24px', margin: '0 0 24px' }}>
              {message}
            </Text>
            {actionUrl && actionText && (
              <Button href={actionUrl} style={{ backgroundColor: '#f59e0b', color: '#ffffff', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
                {actionText}
              </Button>
            )}
          </Section>
          <Text style={{ textAlign: 'center', fontSize: '12px', color: '#a1a1aa', marginTop: '24px' }}>
            You are receiving this email because it contains critical information about your HoopsIQ account.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```
