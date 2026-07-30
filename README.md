# Gobble Drive 📁☁️

[English](README.md) | [日本語](README.ja.md)

> A full-stack cloud storage application built as part of [The Odin Project - File Uploader Lesson](https://www.theodinproject.com/lessons/nodejs-file-uploader).

**Gobble Drive** is a modern, responsive web application for cloud file storage and folder management. Built with Node.js, Express, PostgreSQL, Prisma ORM, and Supabase Storage, it allows users to manage their personal files: uploading files, organizing nested folders, copying/moving items, sharing temporary public download links, starring important items, and searching across their drive.

---

## 🌟 Key Features

- 🔐 **User Authentication & Session Persistence**
  - Secure signup and login using Passport.js (`passport-local`) and `bcryptjs` password hashing.
  - Persistent database session storage backed by PostgreSQL via `@quixo3/prisma-session-store`.
  - Automatic welcome tutorial with starter files on user onboarding.

- 📁 **Folder & File Management**
  - **Hierarchical Folders**: Create nested sub-folders to organize your drive.
  - **Drag & Drop / Modal Upload**: Upload files up to 10MB to Supabase cloud storage (supporting images, PDFs, text, etc.).
  - **Recursive Copying & Moving**: Deep recursive copy of entire folder trees while maintaining nested file references.
  - **Circular Move Protection**: Built-in tree inspection preventing illegal folder moves into own sub-folders.
  - **Deep Recursive Deletion**: Cascading folder deletion that safely removes files from Supabase storage and Postgres.

- ⭐ **Starred & Recent Views**
  - Toggle star status on files and folders for quick access in the Starred view.
  - Recent view categorizes files by activity timeline (*Today*, *Past 7 Days*, *Past 30 Days*).

- 🔗 **Timed Public Sharing**
  - Generate shareable links for individual files or folders with customizable expiration durations (e.g., 1 day, 7 days, 30 days).
  - Public view page allowing visitors to view and download shared files securely before link expiration.

- 🔍 **Instant Navbar Search**
  - Real-time search API returning matching files and folders as you type.

- 🎨 **Responsive EJS UI & Micro-interactions**
  - Modern Google Drive inspired aesthetic using Vanilla CSS, modals, breadcrumb navigation, and interactive context menus.

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Backend Framework** | [Node.js](https://nodejs.org/) (ES Modules), [Express 5](https://expressjs.com/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM v7](https://www.prisma.io/) with `@prisma/adapter-pg` |
| **Cloud File Storage** | [Supabase Storage](https://supabase.com/storage) |
| **Authentication & Sessions** | [Passport.js](http://www.passportjs.org/), `express-session`, `bcryptjs`, `@quixo3/prisma-session-store` |
| **File Upload Handling** | [Multer](https://github.com/expressjs/multer) (Memory Storage) |
| **View Engine & UI** | [EJS](https://ejs.co/), Custom Vanilla CSS |
| **Dev Tools** | Nodemon, Dotenv |

---

## 📁 Project Architecture

```
gobble-drive/
├── config/
│   └── passport-config.js      # Passport local strategy & serialization
├── controllers/
│   ├── dashboardController.js  # Dashboard, recent, starred & search handlers
│   ├── fileController.js       # File/folder CRUD, recursive copy/delete, sharing
│   ├── uploadController.js     # Multer storage stream & Supabase bucket upload
│   └── userController.js       # Signup, login, onboarding & logout handlers
├── lib/
│   ├── prisma.js               # Prisma client initialization with PostgreSQL adapter
│   └── supabase.js             # Supabase storage client configuration
├── middleware/
│   └── authMiddleware.js       # Authentication & route access guard
├── prisma/
│   ├── schema.prisma           # Database models (User, Session, Folder, File, Share)
│   └── migrations/             # Database migration history
├── public/
│   ├── style.css               # Google Drive inspired custom CSS design
│   ├── scripts/                # Front-end interactivity (tutorial, modals)
│   └── gobble_drive_logo.svg   # Project logo & favicons
├── routes/
│   ├── appRouter.js            # Main application router
│   ├── dashboardRouter.js      # Dashboard & search sub-routes
│   └── userRouter.js           # Auth & session sub-routes
├── views/
│   ├── dashboard.ejs           # Main drive dashboard view
│   ├── homepage.ejs            # Welcome / Landing page
│   ├── login.ejs / sign-up-form.ejs
│   └── partials/               # Reusable UI components & modal partials
├── app.js                      # Express application entry point
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL Database** (e.g. Supabase Postgres, Neon, or local PostgreSQL instance)
- **Supabase Storage Bucket** named `uploads` with public read access.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/gobble-drive.git
cd gobble-drive
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/gobble_drive?schema=public"
SESSION_SECRET="your_secret_key_here"
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
```

### 3. Database Migration & Prisma Generation
```bash
# Generate Prisma Client
npm run build

# Deploy migrations to PostgreSQL
npx prisma migrate deploy
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🗄️ Database Schema Summary

- **`User`**: User accounts with encrypted passwords and tutorial flag.
- **`Folder`**: Recursive folder hierarchy linked via `parentId` self-relation.
- **`File`**: File metadata including size, mime type, Supabase bucket path, and parent folder ID.
- **`Share`**: UUID-based temporary access tokens with expiration dates (`expiresAt`) for public sharing.
- **`Session`**: Express session records persisted via `@quixo3/prisma-session-store`.

---

## 📚 Acknowledgments & References

This project was developed as part of **[The Odin Project](https://www.theodinproject.com/)** NodeJS Curriculum:
- Lesson: [NodeJS File Uploader](https://www.theodinproject.com/lessons/nodejs-file-uploader)

---

## 📄 License
[ISC License](LICENSE)
