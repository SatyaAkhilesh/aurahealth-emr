# AuraHealth EMR

AuraHealth EMR is a responsive admin-facing electronic medical records system built with Expo, React Native Web, Supabase, and TypeScript. It provides healthcare staff with a clean interface for managing patients, appointments, prescriptions, and printable patient reports.

## Overview

This application is the admin/provider side of the AuraHealth system. It is designed to help staff:

- create and manage patient records
- schedule and update appointments
- manage prescriptions and refill timelines
- export patient-related data as printable PDF-friendly reports
- navigate a modern dashboard with summary statistics

The app uses a nature-inspired design system and supports responsive behavior across desktop and mobile web.

## Tech Stack

- **Expo**
- **React Native Web**
- **Expo Router**
- **TypeScript**
- **Supabase**
- **Expo Font**
- **Nunito**
- **HTML-based PDF exports**

## Core Features

### Patient Management
- View all patients in a searchable list
- Create new patient records
- View detailed patient profile
- Edit patient information
- Delete patient records
- Copy patient UUID from patient detail page

### Appointment Management
- Create appointments for a patient
- Edit existing appointments
- Delete appointments
- Track appointment status
- Filter appointments by status
- Use quick date buttons for faster scheduling
- Export appointments as a printable PDF

### Prescription Management
- Create prescriptions for a patient
- Edit existing prescriptions
- Delete prescriptions
- Search/select medication from a predefined list
- Track refill dates and refill schedules
- Add doctor’s notes
- Highlight urgent refill timelines
- Export prescriptions as a printable PDF

### Dashboard and Analytics
- Overview page with summary cards
- Dynamic greeting based on time of day
- Quick actions for key workflows
- Recent patients section
- Counts for patients, appointments, prescriptions, and active patients

### Patient Summary Export
- Download a full patient summary report
- Includes:
  - patient information
  - appointment history/list
  - prescription list
  - refill alerts

## App Structure

### Main Routes

- `/admin` — admin dashboard
- `/admin/new` — create patient form
- `/admin/[id]` — patient detail view
- `/admin/[id]/appointments` — appointments CRUD
- `/admin/[id]/prescriptions` — prescriptions CRUD

### File Structure

```bash
app/
  _layout.tsx
  index.tsx
  admin/
    _layout.tsx
    index.tsx
    new.tsx
    [id]/
      index.tsx
      appointments.tsx
      prescriptions.tsx

components/
  Avatar.tsx
  Badge.tsx
  Button.tsx
  Card.tsx
  EmptyState.tsx
  Input.tsx
  LoadingSpinner.tsx

lib/
  supabase.ts
  webUtils.ts
  pdf/
    exportAppointmentsPdf.ts
    exportPrescriptionsPdf.ts
    exportPatientSummaryPdf.ts

theme.ts
