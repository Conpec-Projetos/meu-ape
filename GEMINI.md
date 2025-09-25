# Project: Meu Apê 

## General Project Instructions

### Project Overview

The "Meu Apê" project is a web application for showcasing and managing real estate properties, particularly new developments. It serves three main user roles:
* **Clients:** Can browse properties, save favorites, request visits, and reserve units.
* **Agents (Corretores):** Can browse (some) properties (only those that match their "groups" names), manage their schedules and view client information for scheduled visits.
* **Admins:** Have full CRUD access to properties, users, and can manage visit and reservation requests.

### Core Technologies

When generating code, always adhere to the APIs and conventions of the following technologies:

* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **UI Library:** React
* **Styling:** Tailwind CSS with `shadcn/ui` components.
* **Backend & Database:** Firebase (Firestore, Cloud Storage, Authentication)
* **Form Validation:** Zod
* **Notifications:** Sonner (Toast/Snackbar)
* **Email Sending:** Resend API

### File Structure

Follow the existing file structure. Key directories include:

* `src/app/`: Next.js App Router pages, with routes organized by user roles (e.g., `(admin)`, `(auth)`, `(public)`).
* `src/components/`: Reusable React components.
    * `src/components/ui/`: Core UI components from `shadcn/ui`.
* `src/firebase/`: Firebase configuration and service functions.
* `src/interfaces/`: TypeScript interfaces for data models.
* `src/lib/`: Utility functions.
* `src/hooks/`: Custom React hooks.

## Code Styling and Conventions

### TypeScript and React

* **Functional Components:** All React components must be functional components using hooks.
* **Typing:** Use TypeScript for all new code. Define interfaces for all data structures, especially for Firebase documents (see `src/interfaces/property.ts`).
* **Naming Conventions:**
    * Components: `PascalCase` (e.g., `PropertyCard`).
    * Files: `kebab-case` for pages and components (e.g., `view-property`).
    * Variables and Functions: `camelCase`.
* **Imports:** Use absolute paths for imports, configured with `@/`.

### Tailwind CSS

* **Utility-First:** Use Tailwind CSS utility classes for all styling. Avoid writing custom CSS files unless absolutely necessary.
* **Monochromatic Theme:** The project uses a monochromatic (grayscale) color palette. The theme is defined via CSS variables in src/app/globals.css for both light and dark modes. You must use the semantic utility classes that map to these variables (e.g., bg-primary, text-primary-foreground, bg-secondary, border, ring). This is crucial for maintaining visual consistency and allowing for easy theme updates in the future.
* **Custom Classes and Colors:**
    * **Deprecation:** Custom, single-purpose color classes like .bg-roxo, .bor-roxo, and .text-roxo are deprecated and must not be used in new code. Existing instances should be refactored to use the semantic theme classes (e.g., replace .bg-roxo with bg-primary).
    * **New Styles:** Do not add new custom color classes. If a specific shade is required that is not covered by the existing theme variables (primary, secondary, accent, etc.), prefer using Tailwind's arbitrary value syntax (e.g., bg-[#222]). For colors that will be reused, add a new CSS variable to the :root theme in globals.css.
* **Responsiveness:** All components and pages must be responsive. Use Tailwind's responsive prefixes (e.g., md:, lg:) to adapt layouts for different screen sizes.

## Component-Specific Rules

### `shadcn/ui` Components

* **Usage:** The project heavily relies on `shadcn/ui`. When creating new UI elements, first check if a suitable component exists in `src/components/ui`.
* **Key Components:**
    * `Button`: Use for all clickable actions.
    * `Card`: For structuring content sections.
    * `Input`: For all text-based form inputs.
    * `Form`: Use the provided `Form` components (from `src/components/ui/form.tsx`) for all forms, in conjunction with `react-hook-form` and `zod`.
    * `DropdownMenu`: For user profile menus and other dropdowns.
    * `Sheet`: For mobile sidebars and off-canvas content.

### Custom Components

* **`Header` (`src/components/header/header.tsx`):**
    * The `Header` component's appearance and navigation links are determined by the `variant` prop, which can be `'guest'`, `'client'`, `'agent'`, or `'admin'`.
    * It includes a `SidebarTrigger` for mobile view.
* **`Footer` (`src/components/footer/footer.tsx`):**
    * A static component with links to policies and social media.
* **`AppSidebar` (`src/components/header/app-sidebar.tsx`):**
    * The sidebar's content also changes based on the `variant` prop. It's used for mobile navigation.
* **`ClientWrapper` (`src/components/clientWraper/page.tsx`):**
    * This component wraps the main layout, providing the `SidebarProvider` and including the `Header` and `Footer`.

## Firebase Usage Rules

### Firestore

* **Service Functions:** All interactions with Firestore should be encapsulated in service functions within the `src/firebase/` directory. Do not call Firestore functions directly from components.
* **Data Modeling & Typing:** All data models must strictly adhere to the TypeScript interfaces defined in the src/interfaces/ directory. This ensures type safety and consistency with the data schema defined in the project's UML and requirements documents.
    * Use `User` for documents in the users collection.
    * Use `Property` for documents in the properties collection.
    * Use `Unit` for documents in the units sub-collection.
    * Use `Developer` for documents in the developers collection.
    * Use `VisitRequest`, `ReservationRequest`, and `AgentRegistrationRequest` for their respective collections.
* **Pagination:** For fetching lists of data, always implement cursor-based pagination using startAfter() and limit(), as demonstrated in the buscarPropriedadesPaginado function. Avoid using offset() due to performance and cost issues.
* **Timestamps:** Use Timestamp.fromDate() or Timestamp.now() from the Firebase SDK for writing date fields to Firestore. In the TypeScript interfaces, these fields can be typed as Date | Timestamp for flexibility.

### Cloud Storage

* **Image Uploads:**
    * All user-uploaded images must be compressed on the client-side before uploading to reduce storage costs and improve upload speed. The `browser-image-compression` library is used for this purpose.
    * Store files in organized, predictable paths. For example, property images should be stored in a path like `properties/{propertyId}/{fileName}`.
* **File Naming:** Generate unique and random file names for uploads to prevent collisions and enhance security. A combination of a timestamp and a random string is the preferred method.
* **Image Deletion:** When a Firestore document containing references to Storage objects is deleted, the corresponding files in Cloud Storage must also be deleted to prevent orphaned files. Implement this using `deleteObject` from the Firebase Storage SDK.

## Zod Schema and Validation

* **Schema-Based Validation:** All forms must be validated using Zod schemas.
* **Schema Definition:** Define a Zod schema that matches the form fields and their validation rules (e.g., minimum length, email format).
* **Integration:** Use `zodResolver` from `@hookform/resolvers/zod` to connect Zod schemas with `react-hook-form`.

## Routing and Authentication

* **App Router:** The project uses the Next.js App Router. File-based routing in the `src/app` directory defines the application's routes.
* **Route Groups:** The routes are organized into groups based on access control: `(admin)`, `(auth)`, and `(public)`. This helps in applying different layouts or middleware to different sections of the app.
* **Authentication Flow:**
    * Authentication is managed by Firebase Authentication.
    * User sessions should be persisted.
    * Protected routes should redirect unauthenticated users to the login page.