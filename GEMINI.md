# Project: Meu Apê

## 1. Project Overview

The "Meu Apê" project is a web application for showcasing and managing real estate properties, particularly new developments. It serves three main user roles:

| Role                 | Description                                                | Key Permissions                                                                                                |
| :------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Client**           | A potential buyer interested in properties.                | Browse properties, save favorites, request visits, reserve units.                                              |
| **Agent (Corretor)** | A real estate agent associated with specific developments. | Browse properties within their assigned "groups", manage their schedule, view client details for their visits. |
| **Admin**            | A system administrator with full control.                  | Full CRUD on properties, users, developers. Manage all visit and reservation requests.                         |

### Core Technologies

When generating code, always adhere to the APIs and conventions of the following technologies:

- Framework: Next.js (App Router)
- Language: TypeScript
- UI: React with `shadcn/ui` components
- Styling: Tailwind CSS
- Backend & Data:
    - Firebase (Firestore, Cloud Storage, Authentication)
    - Supabase (Postgres + supabase-js) for relational data and server-side integrations
- State Management: React Context API (e.g., for auth and UI state)
- Form Validation: Zod with react-hook-form
- Notifications: Sonner (toast/snackbar)
- Email Sending: Resend API

## 2. Development Guidelines

### 2.1. File Structure

Adhere to the established file structure to maintain organization and predictability.

- `src/app/`: Next.js App Router pages
    - `(admin)`, `(auth)`, `(public)`: Route groups for access control and layouts
    - `/api/`: API route handlers for server-side logic (e.g., auth, admin, properties, send, user)
- `src/components/`: Reusable React components
    - `/ui/`: Unmodified `shadcn/ui` components
    - `/features/`: Custom components that implement specific features (e.g., `property`, `tables`, `modals`)
    - `/layout/`: Header, footer, client wrapper
- `src/firebase/`: Firebase configuration (`firebase-config.ts`, `firebase-admin-config.ts`) and service functions under feature folders. All direct Firestore and Firebase Storage calls live here.
- `src/supabase/`: Supabase integration
    - `supabase.ts`: Client-side Supabase client (anon key; no elevated privileges)
    - `supabase-admin.ts`: Server-side client with Service Role access for API routes/server actions only
    - `functions/`: (optional) Supabase Edge Functions source if used
    - `properties/`, `tables/`: Domain-oriented query modules and SQL helpers
    - `types/`: Generated database types to ensure type-safe queries
- `src/hooks/`: Custom React hooks (e.g., `use-auth`, `use-users`, `use-properties`)
- `src/interfaces/`: TypeScript type definitions for app models (e.g., `property.ts`, `user.ts`)
- `src/lib/`: Utilities (e.g., `utils.ts`, `geocoding.ts`)
- `src/providers/`: React Context providers (e.g., `auth-provider.tsx`)
- `src/schemas/`: Zod schema definitions for form validation
- `src/services/`: Cross-cutting services (e.g., `notificationService.ts`)
- `src/middleware.ts`: Auth and route protection middleware

Current high-level tree (abbreviated):

```text
src/
├── app/
│  ├── (admin)/ ...
│  ├── (auth)/ ...
│  ├── (public)/ ...
│  └── api/
│     ├── admin/
│     ├── auth/
│     ├── properties/
│     ├── send/
│     └── user/
├── components/
│  ├── features/ ...
│  ├── layout/ ...
│  └── ui/ ...
├── firebase/
│  ├── firebase-admin-config.ts
│  ├── firebase-config.ts
│  └── {agents, properties, signup, users, ...}/
├── supabase/
│  ├── supabase-admin.ts
│  ├── supabase.ts
│  ├── functions/
│  ├── properties/
│  ├── tables/
│  └── types/
├── hooks/ ...
├── interfaces/ ...
├── lib/ ...
├── providers/ ...
├── schemas/ ...
├── services/ ...
└── middleware.ts
```

### 2.2. Code Style & Conventions

#### TypeScript and React

- Functional Components: All React components must be functional components using hooks.
- Typing: Use TypeScript for all new code. Define interfaces for all app-level data structures in `src/interfaces/`. For Supabase tables, prefer generated types in `src/supabase/types/`.
- Naming Conventions:
    - Components: `PascalCase` (e.g., `PropertyCard`).
    - Files: `kebab-case` for pages and components (e.g., `view-property`).
    - Variables and Functions: `camelCase`.
- Imports: Use absolute paths for imports, configured with `@/`.
- State Management: For simple, localized UI state, use React Context API. Avoid introducing complex global state libraries unless absolutely necessary.

#### Tailwind CSS

- Utility-First: Use Tailwind CSS utility classes for all styling. Avoid writing custom CSS files unless absolutely necessary.
- Thematic Styling: The project uses a monochromatic (grayscale) color palette defined via CSS variables in `src/app/globals.css`. - DO: Use semantic utility classes that map to these variables (e.g., `bg-primary`, `text-primary-foreground`, `bg-secondary`, `border`, `ring`). - DO NOT: Add new one-off color classes. For a specific shade not in the theme, use Tailwind's arbitrary value syntax (e.g., `bg-[#222]`). If a color will be reused, add it as a new CSS variable in `globals.css`.
- Responsiveness: All components and pages must be responsive. Use Tailwind's responsive prefixes (e.g., `md:`, `lg:`) to adapt layouts for different screen sizes.

### 2.3. Component-Specific Rules

#### shadcn/ui Components

- Usage: The project heavily relies on `shadcn/ui`. When creating new UI elements, first check if a suitable component exists in `src/components/ui` or in `src/components/features`.
- Key Components: - Button: For all clickable actions - Card: For structuring content sections - Input: For all text-based form inputs - Form: Use the provided `Form` components (from `src/components/ui/form.tsx`) with `react-hook-form` and `zod` - DropdownMenu: For user profile menus and other dropdowns - Sheet: For mobile sidebars and off-canvas content

#### Custom Components

- Header (`src/components/layout/header/header.tsx`):
    - Appearance and navigation links are determined by the `variant` prop: `guest` | `client` | `agent` | `admin`
    - Includes a `SheetTrigger` for mobile view
- Footer (`src/components/layout/footer/footer.tsx`):
    - Static component with links to policies and social media
- ClientWrapper (`src/components/layout/client-wrapper/page.tsx`):
    - Wraps the main layout, provides the `AuthProvider`, and includes the Header and Footer
- Feature Components (`src/components/features/`):
    - Organized by feature (e.g., `property`, `tables`, `modals`)
    - Building blocks of the UI; prefer using them to maintain consistency

## 3. Backend & Data

The app uses both Firebase and Supabase. Keep data access isolated in dedicated service layers; do not query databases directly from React components.

At a high level:

- Firestore/Storage: used for simpler data structures and file storage. This includes users, agent registration requests, visit requests, reservation requests, and storing images/assets.
- Supabase/Postgres: used for complex relational data and queries. This includes developers, properties, units, and features like full-text search and richer aggregations.

### 3.1. Firebase (Firestore + Storage)

- Service Functions: All interactions with Firestore/Storage live under `src/firebase/` feature folders. Do not call Firebase SDKs from components directly.
- Data Modeling & Typing: App-facing models are defined in `src/interfaces/` (e.g., `User`, `Property`, `Unit`, `Developer`, `VisitRequest`, `ReservationRequest`, `AgentRegistrationRequest`).
- Pagination: For Firestore lists, use cursor-based pagination with `startAfter()` and `limit()` (avoid `offset()`).
- Timestamps: Use `Timestamp.fromDate()` or `Timestamp.now()` when writing. Type fields as `Date | Timestamp` in interfaces when appropriate.
- Cloud Storage:
    - Compress images on the client using `browser-image-compression` before upload
    - Store files in predictable paths (e.g., `properties/{propertyId}/{fileName}`)
    - Generate unique filenames (timestamp + random string)
    - Delete Storage objects when their Firestore references are removed (use `deleteObject`)

### 3.2. Supabase (Postgres)

- Clients:
    - `src/supabase/supabase.ts`: Browser-safe client (anon key). Use in client components and hooks. Subject to RLS.
    - `src/supabase/supabase-admin.ts`: Server-side client with Service Role for API routes/server actions only. Never expose this to the browser.
- Service Layer: Put domain-specific query modules under `src/supabase/{domain}/` (e.g., `properties/`). Keep raw SQL or views under `src/supabase/sql/` if needed.
- Typing: Prefer generated database types in `src/supabase/types/` for fully typed queries and rows. Avoid duplicating Postgres table shapes in `src/interfaces/`.
- RLS & Security: Assume Row Level Security is enabled. Only use the admin client on the server. Client-side code should operate with the anon client respecting RLS.
- API/Server Usage: API routes under `src/app/api/` can call Supabase via the admin client for privileged operations; validate input with Zod and return typed responses.

### 3.3. Form Validation (Zod)

- Schema-Based Validation: All forms must be validated using Zod schemas.
- Schema Definition: Define schemas in `src/schemas/` matching form fields and constraints (e.g., min lengths, email format).
- Integration: Use `zodResolver` from `@hookform/resolvers/zod` with `react-hook-form`.

### 3.4. Notifications and Error Handling

- User Feedback: Use `src/services/notificationService.ts` for toast/snackbar notifications.
- API Errors: Catch and surface user-friendly errors; log detailed errors to the console (server) for debugging.
- Form Errors: Display `react-hook-form` validation errors inline with fields.

## 4. Authentication & Routing

- Provider: Authentication is currently managed by Firebase Authentication.
- Flow:
    - User sessions are persisted via a session cookie
    - Protected routes are handled by `src/middleware.ts`, which verifies the session cookie and user role
    - Unauthenticated users are redirected to the login page
- Routing:
    - Uses Next.js App Router (`src/app`)
    - Route groups (`(admin)`, `(auth)`, `(public)`) apply different layouts and access control
    - API routes exist for `admin/`, `auth/`, `properties/`, `send/`, and `user/`
