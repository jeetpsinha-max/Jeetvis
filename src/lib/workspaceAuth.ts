import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { GoogleDriveFile, GmailMessage, CalendarEvent, ClassroomCourse, ClassroomCoursework, ClassroomAnnouncement } from "../types";

// Initialize Firebase Applet instance
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);


// Provider with exact requested scopes for Workspace integration
export const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive");
provider.addScope("https://www.googleapis.com/auth/documents");
provider.addScope("https://www.googleapis.com/auth/spreadsheets.readonly");
provider.addScope("https://www.googleapis.com/auth/presentations.readonly");
provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
provider.addScope("https://www.googleapis.com/auth/calendar.events");
provider.addScope("https://www.googleapis.com/auth/classroom.courses.readonly");
provider.addScope("https://www.googleapis.com/auth/classroom.coursework.me.readonly");
provider.addScope("https://www.googleapis.com/auth/gmail.modify");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Try to see if we can retrieve token or flag auth needs re-login
        if (!isSigningIn) {
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Start Google sign-in popup flow
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Workspace access token.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google Workspace Auth Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  if (auth) await auth.signOut();
  cachedAccessToken = null;
};

// Workspace API: Fetch files list
export const fetchDriveFiles = async (token: string): Promise<GoogleDriveFile[]> => {
  try {
    const query = encodeURIComponent(
      "mimeType = 'application/vnd.google-apps.document' or " +
      "mimeType = 'application/vnd.google-apps.spreadsheet' or " +
      "mimeType = 'application/vnd.google-apps.presentation' or " +
      "mimeType = 'application/vnd.google-apps.folder' or " +
      "mimeType = 'text/plain' or " +
      "mimeType = 'application/pdf'"
    );
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=25&fields=files(id,name,mimeType,webViewLink,modifiedTime,size)&q=${query}&orderBy=modifiedTime%20desc`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.error("Failed to fetch Google Drive files:", err);
    throw err;
  }
};

// Workspace API: Fetch Google Doc Content
export const fetchDocContent = async (token: string, docId: string): Promise<string> => {
  try {
    const url = `https://docs.googleapis.com/v1/documents/${docId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Could not retrieve document structure.");
    const data = await response.json();
    
    // Extract text paragraphs from document body
    let fullText = "";
    if (data.body && data.body.content) {
      for (const element of data.body.content) {
        if (element.paragraph && element.paragraph.elements) {
          for (const el of element.paragraph.elements) {
            if (el.textRun && el.textRun.content) {
              fullText += el.textRun.content;
            }
          }
        }
      }
    }
    return fullText || "# Empty Google Doc\nNo textual content found.";
  } catch (err) {
    console.error("Failed to load Google Doc content:", err);
    return `// Failed to load Google Doc: ${err instanceof Error ? err.message : String(err)}`;
  }
};

// Workspace API: Fetch Google Spreadsheet Data
export const fetchSheetContent = async (token: string, sheetId: string): Promise<string> => {
  try {
    // Get details about spreadsheet structure
    const urlMetadata = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
    const responseMeta = await fetch(urlMetadata, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!responseMeta.ok) throw new Error("Could not retrieve spreadsheet schema.");
    const metaData = await responseMeta.json();
    const sheetName = metaData.sheets?.[0]?.properties?.title || "Sheet1";

    // Fetch the grid data from the first sheet
    const urlValues = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A1:H30`;
    const responseValues = await fetch(urlValues, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!responseValues.ok) throw new Error("Could not read spreadsheet cells.");
    const dataValues = await responseValues.json();
    
    if (!dataValues.values || dataValues.values.length === 0) {
      return "## Empty Google Sheet\nNo cell values detected.";
    }

    // Format grid values as a Markdown table
    let markdownTable = `### Spreadsheet: ${metaData.properties?.title || "Data Sheet"}\n\n`;
    const rows: string[][] = dataValues.values;
    
    // Header row
    const headers = rows[0];
    markdownTable += "| " + headers.join(" | ") + " |\n";
    markdownTable += "| " + headers.map(() => "---").join(" | ") + " |\n";
    
    // Data rows
    for (let i = 1; i < rows.length; i++) {
      markdownTable += "| " + rows[i].join(" | ") + " |\n";
    }

    return markdownTable;
  } catch (err) {
    console.error("Failed to load Google Sheet content:", err);
    return `// Failed to load Google Sheet: ${err instanceof Error ? err.message : String(err)}`;
  }
};

// Workspace API: Fetch Google Slides Content
export const fetchSlidesContent = async (token: string, presentationId: string): Promise<string> => {
  try {
    const url = `https://slides.googleapis.com/v1/presentations/${presentationId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Could not retrieve presentation slides.");
    const data = await response.json();
    
    let markdownDeck = `# Presentation: ${data.title || "Slides Deck"}\n\n`;
    
    if (data.slides) {
      data.slides.forEach((slide: any, idx: number) => {
        markdownDeck += `## Slide ${idx + 1}\n`;
        if (slide.pageElements) {
          slide.pageElements.forEach((el: any) => {
            if (el.shape && el.shape.text && el.shape.text.textElements) {
              el.shape.text.textElements.forEach((te: any) => {
                if (te.textRun && te.textRun.content) {
                  const txt = te.textRun.content.trim();
                  if (txt) markdownDeck += `- ${txt}\n`;
                }
              });
            }
          });
        }
        markdownDeck += "\n---\n\n";
      });
    }
    
    return markdownDeck;
  } catch (err) {
    console.error("Failed to load Google Slides content:", err);
    return `// Failed to load Google Slides: ${err instanceof Error ? err.message : String(err)}`;
  }
};

// Gmail Interface and API Helpers
export const fetchGmailMessages = async (token: string): Promise<GmailMessage[]> => {
  try {
    const listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10";
    const response = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Gmail API returned status ${response.status}`);
    const listData = await response.json();
    const messages = listData.messages || [];
    
    const detailedMessages: GmailMessage[] = [];
    for (const msg of messages) {
      try {
        const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
        const detailRes = await fetch(detailUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const headers = detailData.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
          const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
          const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
          
          let senderName = from;
          let senderEmail = from;
          const fromMatch = from.match(/^(.*?)\s*<(.*?)>$/);
          if (fromMatch) {
            senderName = fromMatch[1].trim();
            senderEmail = fromMatch[2].trim();
          }
          
          let body = detailData.snippet || "";
          if (detailData.payload?.body?.data) {
            try {
              body = atob(detailData.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
            } catch (e) {}
          } else if (detailData.payload?.parts) {
            const findTextPart = (parts: any[]): string => {
              for (const part of parts) {
                if (part.mimeType === "text/plain" && part.body?.data) {
                  try {
                    return atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
                  } catch (e) {}
                } else if (part.parts) {
                  const subText = findTextPart(part.parts);
                  if (subText) return subText;
                }
              }
              return "";
            };
            const extracted = findTextPart(detailData.payload.parts);
            if (extracted) body = extracted;
          }
          
          const isRead = !detailData.labelIds?.includes("UNREAD");
          
          detailedMessages.push({
            id: detailData.id,
            threadId: detailData.threadId,
            senderName: senderName || senderEmail,
            senderEmail,
            subject,
            snippet: detailData.snippet || "",
            body,
            date: new Date(date).toLocaleDateString(),
            isRead,
            category: detailData.labelIds?.includes("SPAM") ? "spam" : "general"
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch details for message ${msg.id}:`, err);
      }
    }
    return detailedMessages;
  } catch (err) {
    console.error("Failed to fetch Gmail messages:", err);
    throw err;
  }
};

// Workspace API: Fetch Folder Content
export const fetchFolderContent = async (token: string, folderId: string): Promise<GoogleDriveFile[]> => {
  try {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,webViewLink,modifiedTime,size)&q=${query}&orderBy=folder,name`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Google API returned status ${response.status}`);
    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.error("Failed to fetch folder content:", err);
    throw err;
  }
};

export const sendGmailMessage = async (
  token: string,
  to: string,
  subject: string,
  body: string
): Promise<boolean> => {
  try {
    const emailContent = [
      `To: ${to}`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${subject}`,
      "",
      body,
    ].join("\r\n");

    const base64Safe = btoa(unescape(encodeURIComponent(emailContent)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64Safe }),
    });

    return response.ok;
  } catch (err) {
    console.error("Failed to send Gmail message:", err);
    return false;
  }
};

// Google Calendar Interface and API Helpers
export const fetchCalendarEvents = async (token: string): Promise<CalendarEvent[]> => {
  try {
    const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=15&orderBy=startTime&singleEvents=true";
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Calendar API returned status ${response.status}`);
    const data = await response.json();
    const items = data.items || [];
    return items.map((item: any) => ({
      id: item.id,
      summary: item.summary || "(No Title)",
      description: item.description || "",
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || "",
      location: item.location || "",
      status: item.status || "confirmed"
    }));
  } catch (err) {
    console.error("Failed to fetch Calendar events:", err);
    throw err;
  }
};

export const createCalendarEvent = async (
  token: string,
  event: { summary: string; description?: string; start: string; end: string; location?: string }
): Promise<boolean> => {
  try {
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: { dateTime: new Date(event.start).toISOString() },
        end: { dateTime: new Date(event.end).toISOString() },
        location: event.location
      }),
    });
    return response.ok;
  } catch (err) {
    console.error("Failed to create Calendar event:", err);
    return false;
  }
};

// Google Classroom Interface and API Helpers
export const fetchClassroomCourses = async (token: string): Promise<ClassroomCourse[]> => {
  try {
    const url = "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE";
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Classroom API returned status ${response.status}`);
    const data = await response.json();
    const courses = data.courses || [];
    return courses.map((c: any) => ({
      id: c.id,
      name: c.name,
      section: c.section,
      descriptionHeading: c.descriptionHeading,
      room: c.room,
      alternateLink: c.alternateLink
    }));
  } catch (err) {
    console.error("Failed to fetch Classroom courses:", err);
    throw err;
  }
};

export const fetchClassroomCoursework = async (token: string, courseId: string): Promise<ClassroomCoursework[]> => {
  try {
    const url = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Classroom CourseWork API returned status ${response.status}`);
    const data = await response.json();
    const coursework = data.courseWork || [];
    return coursework.map((cw: any) => ({
      id: cw.id,
      title: cw.title,
      description: cw.description,
      alternateLink: cw.alternateLink,
      creationTime: cw.creationTime,
      dueDate: cw.dueDate,
      maxPoints: cw.maxPoints
    }));
  } catch (err) {
    console.error("Failed to fetch Classroom coursework:", err);
    throw err;
  }
};

export const fetchClassroomAnnouncements = async (token: string, courseId: string): Promise<ClassroomAnnouncement[]> => {
  try {
    const url = `https://classroom.googleapis.com/v1/courses/${courseId}/announcements`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Classroom Announcements API returned status ${response.status}`);
    const data = await response.json();
    const announcements = data.announcements || [];
    return announcements.map((a: any) => ({
      id: a.id,
      text: a.text,
      alternateLink: a.alternateLink,
      creationTime: a.creationTime
    }));
  } catch (err) {
    console.error("Failed to fetch Classroom announcements:", err);
    throw err;
  }
};

