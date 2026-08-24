# System Design: Healthcare Appointment Manager

This document outlines the core technical design decisions, focusing on concurrency, slot management, administrative actions, and fault tolerance within the Healthcare Appointment Manager.

## 1. Double-Booking Prevention
Concurrency control prevents multiple patients from booking the exact same doctor simultaneously. We use a **two-layer defence mechanism**.

### Layer 1: Application-Level Validation
When a slot is confirmed or held, the backend calculates availability by factoring in existing appointments, active slot holds, and doctor leave days, immediately rejecting invalid requests.

### Layer 2: Database Integrity (`UNIQUE` Constraint)
The PostgreSQL database is the ultimate source of truth. The `appointments` table enforces a composite unique constraint: `UNIQUE(doctor_id, slot_time)`. 
If two parallel requests bypass the initial application-level validation simultaneously due to race conditions, they will both attempt an `INSERT`. Only one will succeed. The second transaction will violate the unique constraint and throw a `ConstraintViolationException`. The Spring Boot backend uses an `@ExceptionHandler` to catch this, returning an HTTP 409 Conflict error.

## 2. Slot Hold Mechanism

Booking an appointment involves a multi-step process where patients must fill out a comprehensive symptom form. To guarantee that a patient does not lose their slot while typing, a **slot hold mechanism** is employed.

- **Hold Initiation:** When a user selects a time slot, a hold is placed and recorded in the `slot_holds` table with an expiration timestamp (e.g., 10 minutes in the future).
- **Slot Exclusion:** When the backend calculates available slots for a doctor on a specific date, it actively queries both confirmed appointments and unexpired holds. Any held slot is excluded from the list returned to other patients.
- **Background Cleanup:** A Spring `@Scheduled` background job runs every 60 seconds. It sweeps the `slot_holds` table and deletes any holds where the expiration timestamp has passed. This immediately frees up the slot for others.
- **Confirmation Validation:** When the patient submits the final booking request, they provide the `holdId`. The `POST /api/v1/appointments/confirm` endpoint verifies that the hold exists, belongs to the authenticated patient, targets the correct slot, and has not expired. Only then is the actual appointment created.

## 3. Doctor Leave Conflict Handling

Administrators require the ability to mark leave days for doctors, which inherently conflicts with any pre-existing patient bookings on those days. 

- **Immediate Detection:** When the `POST /api/v1/admin/doctors/{id}/leave` endpoint is invoked, the system first creates a record in the `doctor_leave_days` table. It then queries the `appointments` table for any `PENDING` or `CONFIRMED` appointments belonging to that doctor on the specified date.
- **Automated Cancellation:** The system iterates over the affected appointments and sets their status to `CANCELLED`.
- **Asynchronous Notification Queueing:** The system does not block the HTTP response by attempting to send emails synchronously. Instead, it creates a new entry in the `email_logs` table for each affected patient, marked with a `PENDING` status.
- **Admin Feedback:** The API immediately returns a response to the admin, containing a list of the affected appointments, allowing the frontend to display an informative modal showing exactly which patients were impacted.

## 4. Notification & LLM Failure Handling

The system integrates with external APIs for emails (SendGrid), Google Calendar (OAuth), and AI processing (OpenAI). External dependencies are prone to network timeouts and rate limits, demanding a fault-tolerant design.

### Email Failures
All outgoing communications are recorded in the `email_logs` table *before* transmission. If an email fails to send due to a network error or API outage, the status is marked as `FAILED`. 
A background `@Scheduled` job runs every 15 minutes, selecting all `FAILED` or `PENDING` emails that have a retry count below 3. It reattempts delivery, incrementing the retry count on each failure. This guarantees eventual consistency.

### Google Calendar Sync Failures
Google Calendar synchronization occurs asynchronously after an appointment is confirmed or cancelled. These operations are non-blocking. If the Calendar API returns an error (e.g., revoked token), the exception is caught, logged, and suppressed. The core domain action (the booking itself) succeeds regardless of the calendar sync status.

### LLM Processing Failures
Generating pre-visit symptom summaries and post-visit clinical notes involves the OpenAI API. 
Because LLM generation can take several seconds and is susceptible to rate limits, the booking process does not wait for the LLM. 
The LLM summaries are tracked via `pre_visit_summaries` and `post_visit_notes` tables with a status column (`PENDING`, `COMPLETED`, `FAILED`). A scheduled job automatically retries failed LLM generations up to 3 times. Additionally, the Admin Portal features an LLM Monitor dashboard, granting administrators the ability to manually trigger a retry for any persistently failed summary, ensuring no clinical data is left unprocessed.
