# Confluence User Story: Note Creation, Editing, Deletion, and Sharing on ShareNotes.com

**JIRA ID:** SN-101

**Status:** To Do

**Epic:** Core Note Management & Sharing

**Priority:** High

**Author:** Product Team

**Created:** September 9, 2026

---

## User Story

**As a** registered user of `sharenotes.com`,

**I want to** create, edit, delete, and share my notes via a unique link,

**So that** I can easily store my thoughts and collaborate or share information with others quickly and securely.

---

## Acceptance Criteria

### 1. Note Creation

- Given a user is logged into `sharenotes.com`,
- When they click on the **"New Note"** button,
- Then a rich-text editor interface should open allowing them to input and save a note.
- **Constraint:** Individual note size (including text and attachments) must not exceed **30 MB max**. If the limit is exceeded, an error message should be displayed informing the user.

### 2. Note Sharing

- Given a user has created and saved a note,
- When they click the **"Share"** option,
- Then a unique, shareable URL link for that specific note should be generated and copied to the clipboard.
- Given an unauthenticated or external user opens the shared link,
- Then they should be able to view the read-only version of the note without needing to log in.

### 3. Note Editing

- Given a user is the owner of an existing note,
- When they open the note and make modifications in the editor,
- Then the changes should be successfully saved and reflected instantly for the owner and anyone accessing the shared link.

### 4. Note Deletion

- Given a user is viewing their list of notes or a specific note,
- When they click **"Delete"** and confirm the action via a confirmation prompt,
- Then the note must be permanently removed, and any subsequent attempts to access via the shared link should result in a **404 Not Found** or "Note has been deleted" message.

---

## Technical & Non-Functional Notes

- **Domain:** Hosted at `sharenotes.com`.
- **Storage Limit:** File/Payload validation middleware on the backend to enforce the **30 MB max** note size limit.
- **Security:** Ensure that only the creator/owner has permissions to edit or delete the note, while view permissions can be public via the unique token/link.

---

## What's Next? (Step 1 Continued)

Does this user story look good to you? Once approved, we will capture this in **`requirements.md`**, commit it, and move on to **Step 2: Architecture**!
