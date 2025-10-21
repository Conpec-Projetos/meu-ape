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

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI:** React with `shadcn/ui` components.
- **Styling:** Tailwind CSS.
- **Backend & Database:** Firebase (Firestore, Cloud Storage, Authentication)
- **State Management:** React Context API (e.g., for UI state like sidebars).
- **Form Validation:** Zod
- **Notifications:** Sonner (Toast/Snackbar)
- **Email Sending:** Resend API

## 2. Development Guidelines

### 2.1. File Structure

Adhere to the established file structure to maintain organization and predictability.

- `src/app/`: Next.js App Router pages.
    - `(admin)`, `(auth)`, `(public)`: Route groups for access control and layouts.
    - `/api/`: API route handlers for server-side logic (e.g., Resend integration).
- `src/components/`: Reusable React components.
    - `/ui/`: Unmodified `shadcn/ui` components.
    - `/features/`: Custom components that implement specific features (e.g., `property-search-filter`, `user-table`).
    - `/layout/`: Components that define the overall layout of the application (e.g., `header`, `footer`).
- `src/firebase/`: Firebase configuration (`firebase-config.ts` and `firebase-admin-config.ts`) and service functions (e.g., `/properties/service.ts`, `/users/service.ts`). **All direct database/storage calls must be placed here.**
- `src/hooks/`: Custom React hooks (e.g., `useAuth`, `useUsers`).
- `src/interfaces/`: TypeScript type definitions for all data models (e.g., `property.ts`, `user.ts`).
- `src/lib/`: Utility functions (e.g., `utils.ts`).
- `src/providers/`: React Context providers (e.g., `auth-provider.tsx`).
- `src/schemas/`: Zod schema definitions for form validation.

```
src/
├───app/
│   ├───(admin)/
│   │   ├───admin/
│   │   │   ├───property-management/
│   │   │   │   └───page.tsx
│   │   │   └───users/
│   │   │       └───page.tsx
│   │   └───beta/
│   │       ├───dashboard/
│   │       │   └───page.tsx
│   │       └───property/
│   │           ├───write/
│   │           │   ├───[id]/
│   │           │   │   └───page.tsx
│   │           │   └───page.tsx
│   │           └───page.tsx
│   ├───(auth)/
│   │   ├───agent-signup/
│   │   │   ├───accepted/
│   │   │   │   └───page.tsx
│   │   │   └───page.tsx
│   │   ├───forgot-password/
│   │   ├───login/
│   │   │   └───page.tsx
│   │   └───signup/
│   │       └───page.tsx
│   ├───(public)/
│   │   ├───dashboard/
│   │   │   └───page.tsx
│   │   ├───profile/
│   │   │   └───page.tsx
│   │   └───properties/
│   │       └───[id]/
│   │           └───page.tsx
│   ├───api/
│   │   ├───admin/
│   │   │   ├───agent-requests/
│   │   │   │   ├───[id]/
│   │   │   │   │   └───action/
│   │   │   │   │       └───route.ts
│   │   │   │   └───route.ts
│   │   │   └───users/
│   │   │       ├───[id]/
│   │   │       │   └───route.ts
│   │   │       ├───counts/
│   │   │       │   └───route.ts
│   │   │       └───route.ts
│   │   ├───auth/
│   │   │   ├───login/
│   │   │   │   └───route.ts
│   │   │   ├───logout/
│   │   │   │   └───route.ts
│   │   │   └───verify-session/
│   │   │       └───route.ts
│   │   ├───send/
│   │       └───route.ts
│   ├───favicon.ico
│   ├───globals.css
│   ├───layout.tsx
│   └───page.tsx
├───assets/
├───components/
│   ├───features/
│   │   ├───alerts/
│   │   │   └───default-alert.tsx
│   │   ├───avatars/
│   │   │   └───default-avatar.tsx
│   │   ├───badges/
│   │   │   └───default-badge.tsx
│   │   ├───buttons/
│   │   │   └───default-button.tsx
│   │   ├───calendars/
│   │   │   └───default-calendar.tsx
│   │   ├───cards/
│   │   │   ├───card-reservations.tsx
│   │   │   ├───card-visits.tsx
│   │   │   ├───default-card.tsx
│   │   │   └───default-hover-card.tsx
│   │   ├───carousels/
│   │   │   └───default-carousel.tsx
│   │   ├───charts/
│   │   │   └───chart.tsx
│   │   ├───checkboxes/
│   │   │   └───default-checkbox.tsx
│   │   ├───collapsibles/
│   │   │   └───default-collapsible.tsx
│   │   ├───dashboard/
│   │   ├───dialogs/
│   │   │   ├───default-alert-dialog.tsx
│   │   │   └───default-dialog.tsx
│   │   ├───drawers/
│   │   │   └───default-drawer.tsx
│   │   ├───dropdowns/
│   │   │   └───default-dropdown-menu.tsx
│   │   ├───emails/
│   │   │   └───agent-registration.tsx
│   │   ├───filters/
│   │   │   └───property-search-filter.tsx
│   │   ├───forms/
│   │   │   └───default-form.tsx
│   │   ├───inputs/
│   │   │   └───default-input.tsx
│   │   ├───labels/
│   │   │   └───default-label.tsx
│   │   ├───menus/
│   │   │   └───default-navigation-menu.tsx
│   │   ├───modals/
│   │   │   ├───add-unit-modal.tsx
│   │   │   ├───delete-confirmation-modal.tsx
│   │   │   ├───denial-modal.tsx
│   │   │   ├───edit-images-modal.tsx
│   │   │   ├───input-modal.tsx
│   │   │   ├───password-modal.tsx
│   │   │   └───user-modal.tsx
│   │   ├───property/
│   │   │   ├───matterport-viewer.tsx
│   │   │   ├───property-header.tsx
│   │   │   ├───property-image-gallery.tsx
│   │   │   ├───property-map.tsx
│   │   │   ├───unit-card.tsx
│   │   │   ├───unit-list.tsx
│   │   │   └───unit-selector.tsx
│   │   ├───radios/
│   │   │   └───default-radio-group.tsx
│   │   ├───selects/
│   │   │   └───default-select.tsx
│   │   ├───separators/
│   │   │   └───default-separator.tsx
│   │   ├───sheets/
│   │   │   ├───default-sheet.tsx
│   │   │   ├───sheet-reservations.tsx
│   │   │   └───sheet-visits.tsx
│   │   ├───sidebar/
│   │   │   └───default-sidebar.tsx
│   │   ├───skeletons/
│   │   │   └───default-skeleton.tsx
│   │   ├───sliders/
│   │   │   └───default-slider.tsx
│   │   ├───switches/
│   │   │   └───default-switch.tsx
│   │   ├───tables/
│   │   │   ├───agent-request-table.tsx
│   │   │   ├───default-table.tsx
│   │   │   ├───PropertyTable.tsx
│   │   │   └───user-table.tsx
│   │   ├───tabs/
│   │   │   └───tabs.tsx
│   │   ├───toggles/
│   │   │   ├───default-toggle-group.tsx
│   │   │   └───default-toggle.tsx
│   │   └───tooltips/
│   │       └───default-tooltip.tsx
│   ├───layout/
│   │   ├───client-wrapper/
│   │   │   └───page.tsx
│   │   ├───footer/
│   │   │   └───footer.tsx
│   │   └───header/
│   │       └───header.tsx
│   └───ui/
│       ├───alert-dialog.tsx
│       ├───alert.tsx
│       ├───avatar.tsx
│       ├───badge.tsx
│       ├───button.tsx
│       ├───calendar.tsx
│       ├───card.tsx
│       ├───carousel.tsx
│       ├───chart.tsx
│       ├───checkbox.tsx
│       ├───collapsible.tsx
│       ├───dialog.tsx
│       ├───drawer.tsx
│       ├───dropdown-menu.tsx
│       ├───form.tsx
│       ├───hover-card.tsx
│       ├───input.tsx
│       ├───label.tsx
│       ├───navigation-menu.tsx
│       ├───pagination.tsx
│       ├───popover.tsx
│       ├───progress.tsx
│       ├───radio-group.tsx
│       ├───resizable.tsx
│       ├───scroll-area.tsx
│       ├───select.tsx
│       ├───separator.tsx
│       ├───sheet.tsx
│       ├───sidebar.tsx
│       ├───skeleton.tsx
│       ├───slider.tsx
│       ├───switch.tsx
│       ├───table.tsx
│       ├───tabs.tsx
│       ├───textarea.tsx
│       ├───toggle-group.tsx
│       ├───toggle.tsx
│       └───tooltip.tsx
├───contexts/
│   └───auth-context.tsx
├───firebase/
│   ├───agentRegistrationRequest/
│   │   └───service.ts
│   ├───properties/
│   │   └───service.ts
│   ├───signup/
│   │   └───service.ts
│   ├───users/
│   │   └───service.ts
│   ├───firebase-admin-config.ts
│   └───firebase-config.ts
├───hooks/
│   ├───use-agent-requests.ts
│   ├───use-auth.ts
│   ├───use-mobile.ts
│   ├───use-user-counts.ts
│   └───use-users.ts
├───interfaces/
│   ├───agentRegistrationRequest.ts
│   ├───developer.ts
│   ├───property.ts
│   ├───propertyOld.ts
│   ├───reservationRequest.ts
│   ├───unit.ts
│   ├───user.ts
│   └───visitRequest.ts
├───lib/
│   └───utils.ts
├───providers/
│   └───auth-provider.tsx
├───schemas/
│   ├───agentRegistrationRequestSchema.ts
│   ├───loginSchema.ts
│   ├───propertySchema.ts
│   ├───signupSchema.ts
│   └───userSchema.ts
└───middleware.ts
```

### 2.2. Code Style & Conventions

#### TypeScript and React

- **Functional Components:** All React components must be functional components using hooks.
- **Typing:** Use TypeScript for all new code. Define interfaces for all data structures in `src/interfaces/`, especially for Firebase documents (see `src/interfaces/property.ts`).
- **Naming Conventions:**
    - Components: `PascalCase` (e.g., `PropertyCard`).
    - Files: `kebab-case` for pages and components (e.g., `view-property`).
    - Variables and Functions: `camelCase`.
- **Imports:** Use absolute paths for imports, configured with `@/`.
- **State Management:** For simple, localized UI state, use React Context API. Avoid introducing complex global state libraries unless absolutely necessary.

#### Tailwind CSS

- **Utility-First:** Use Tailwind CSS utility classes for all styling. Avoid writing custom CSS files unless absolutely necessary.
- **Thematic Styling:** The project uses a monochromatic (grayscale) color palette defined via CSS variables in `src/app/globals.css`.
    - **DO:** Use semantic utility classes that map to these variables (e.g., `bg-primary`, `text-primary-foreground`, `bg-secondary`, `border`, `ring`). This is crucial for consistency and theme support.
    - **DO NOT:** Add new one-off color classes. For a specific shade not in the theme, use Tailwind's arbitrary value syntax (e.g., `bg-[#222]`). If a color will be reused, add it as a new CSS variable in `globals.css`.
- **Responsiveness:** All components and pages must be responsive. Use Tailwind's responsive prefixes (e.g., md:, lg:) to adapt layouts for different screen sizes.

### 2.3. Component-Specific Rules

#### `shadcn/ui` Components

- **Usage:** The project heavily relies on `shadcn/ui`. When creating new UI elements, first check if a suitable component exists in `src/components/ui` or in '`src/components/features'.
- **Key Components:**
    - `Button`: Use for all clickable actions.
    - `Card`: For structuring content sections.
    - `Input`: For all text-based form inputs.
    - `Form`: Use the provided `Form` components (from `src/components/ui/form.tsx`) for all forms, in conjunction with `react-hook-form` and `zod`.
    - `DropdownMenu`: For user profile menus and other dropdowns.
    - `Sheet`: For mobile sidebars and off-canvas content.

#### Custom Components

- **`Header` (`src/components/layout/header/header.tsx`):**
    - The `header` component's appearance and navigation links are determined by the `variant` prop, which can be `'guest'`, `'client'`, `'agent'`, or `'admin'`.
    - It includes a `SheetTrigger` for mobile view.
- **`Footer` (`src/components/layout/footer/footer.tsx`):**
    - A static component with links to policies and social media.
- **`ClientWrapper` (`src/components/layout/client-wrapper/page.tsx`):**
    - This component wraps the main layout, providing the `AuthProvider` and including the `Header` and `Footer`.
- **Feature Components (`src/components/features/`):**
    - These components are organized by feature (e.g., `property`, `tables`, `modals`).
    - They are the building blocks of the application's UI and should be used whenever possible to maintain consistency.

## 3. Backend & Data

### 3.1. Firestore

- **Service Functions:** All interactions with Firestore should be encapsulated in service functions within the `src/firebase/` directory. Do not call Firestore functions directly from components.
- **Data Modeling & Typing:** All data models must strictly adhere to the TypeScript interfaces defined in the `src/interfaces/` directory. This ensures type safety and consistency. Key interfaces include:
    - Use `User` for documents in the users collection.
    - Use `Property` for documents in the properties collection.
    - Use `Unit` for documents in the units sub-collection.
    - Use `Developer` for documents in the developers collection.
    - Use `VisitRequest`, `ReservationRequest`, and `AgentRegistrationRequest` for their respective collections.
- **Pagination:** For fetching lists of data, always implement cursor-based pagination using startAfter() and limit(), as demonstrated in the `buscarPropriedadesPaginado` function. Avoid using offset() due to performance and cost issues.
- **Timestamps:** Use `Timestamp.fromDate()` or `Timestamp.now()` from the Firebase SDK for writing date fields to Firestore. In the TypeScript interfaces, these fields can be typed as `Date | Timestamp` for flexibility.

### 3.2. Cloud Storage

- **Image Uploads:**
    - All user-uploaded images must be compressed on the client-side before uploading to reduce storage costs and improve upload speed. The `browser-image-compression` library is used for this purpose.
    - Store files in organized, predictable paths. For example, property images should be stored in a path like `properties/{propertyId}/{fileName}`.
- **File Naming:** Generate unique and random file names for uploads to prevent collisions and enhance security. A combination of a timestamp and a random string is the preferred method.
- **Image Deletion:** When a Firestore document containing references to Storage objects is deleted, the corresponding files in Cloud Storage must also be deleted to prevent orphaned files. Implement this using `deleteObject` from the Firebase Storage SDK.

### 3.3. Form Validation (Zod)

- **Schema-Based Validation:** All forms must be validated using Zod schemas.
- **Schema Definition:** Define a Zod schema in the `src/schemas/` directory that matches the form fields and their validation rules (e.g., minimum length, email format).
- **Integration:** Use `zodResolver` from `@hookform/resolvers/zod` to connect Zod schemas with `react-hook-form`.

### 3.4. Notifications and Error Handling

- **User Feedback:** Use the `sonner` library for all toast/snackbar notifications to provide feedback for actions (e.g., "Property saved successfully," "An error occurred").
- **API Errors:** Gracefully handle errors from Firebase and other APIs. Display user-friendly messages via `sonner` and log detailed errors to the console for debugging.
- **Form Errors:** Display validation errors from `react-hook-form` inline with the corresponding form fields.

## 4. Authentication & Routing

- **Provider:** Authentication is managed by Firebase Authentication.
- **Flow:**
    - User sessions are persisted via a session cookie.
    - Protected routes are handled by the `middleware.ts` file, which verifies the session cookie and user role.
    - Unauthenticated users are redirected to the login page.
- **Routing:**
    - The project uses the Next.js App Router. File-based routing in the `src/app` directory defines the application's routes.
    - Route groups (`(admin)`, `(auth)`, `(public)`) are used to apply different layouts and access control logic.
