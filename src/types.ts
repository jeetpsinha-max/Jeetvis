/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubStep {
  title: string;
  description: string;
  estimatedMinutes: number;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  progress: number; // calculated completed sub-steps
  steps: SubStep[];
  loading?: boolean;
  isArchived?: boolean;
}

export interface Email {
  id: string;
  sender: string;
  senderName: string;
  subject: string;
  body: string;
  timestamp: string;
  isSpam: boolean;
  spamReason?: string;
  category: "work" | "newsletter" | "personal" | "finance";
  isRead: boolean;
  aiDraft?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  status: string;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  alternateLink: string;
}

export interface ClassroomCoursework {
  id: string;
  title: string;
  description?: string;
  alternateLink: string;
  creationTime: string;
  dueDate?: { year: number; month: number; day: number };
  maxPoints?: number;
}

export interface ClassroomAnnouncement {
  id: string;
  text: string;
  alternateLink: string;
  creationTime: string;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  content: string;
  language: string;
  id?: string;
  webViewLink?: string;
}

export interface Memory {
  id: string;
  category: "user_preference" | "interaction_fact" | "code_snippet" | "custom_note";
  content: string;
  importance: "high" | "medium" | "low";
  timestamp: string;
  userId: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  modifiedTime: string;
  size?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isRead: boolean;
  category: string;
}

export interface WorkspaceUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  timestamp: string;
}

