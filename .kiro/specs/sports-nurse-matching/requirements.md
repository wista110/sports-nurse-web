# Requirements Document

## Introduction

This document outlines the requirements for a sports nurse matching platform that connects qualified sports nurses with event organizers who need medical support for sports events and competitions. The platform operates as a marketplace with escrow functionality, similar to Timee's gig matching model, but specialized for healthcare professionals in sports settings.

The MVP focuses on the core user journey from job posting to payment completion, with mock payment processing and essential safety features for handling medical service arrangements.

## Requirements

### Requirement 1: Job Posting and Management

**User Story:** As an event organizer, I want to post detailed job requirements for sports nurse services, so that qualified nurses can understand and apply for positions at my events.

#### Acceptance Criteria

1. WHEN an organizer accesses /jobs/new THEN the system SHALL display a comprehensive job creation form
2. WHEN creating a job THEN the system SHALL require venue location, start/end times, sport categories, job details, required headcount, compensation, and application deadline
3. WHEN submitting job data THEN the system SHALL validate that start time is before end time, deadline is before or equal to start time, compensation is >= 0, and headcount is >= 1
4. WHEN a job is published THEN the system SHALL make it publicly viewable at /jobs/[id] without displaying personal information
5. WHEN creating a job THEN the system SHALL allow saving as draft before publishing
6. WHEN a job is published THEN the system SHALL include it in search results and job listings

### Requirement 2: Job Discovery and Application

**User Story:** As a sports nurse, I want to search and filter available positions and apply with questions or custom quotes, so that I can find suitable work opportunities and communicate my specific requirements.

#### Acceptance Criteria

1. WHEN accessing /jobs THEN the system SHALL display searchable and filterable job listings by location, date, sport category, compensation, and deadline
2. WHEN viewing /jobs THEN the system SHALL provide sorting options for job listings
3. WHEN viewing a job detail page THEN the system SHALL display an "Apply" button for authenticated nurses
4. WHEN applying for a job THEN the system SHALL allow nurses to include questions and custom quotes with cost breakdowns
5. WHEN an application is submitted THEN the system SHALL notify the organizer via in-app notification and email
6. WHEN an application is submitted THEN the system SHALL create a communication thread between the nurse and organizer

### Requirement 3: In-App Communication System

**User Story:** As both an organizer and nurse, I want to communicate through secure in-app messaging to clarify requirements and resolve any questions before finalizing agreements.

#### Acceptance Criteria

1. WHEN accessing /inbox THEN the system SHALL display all message threads with read/unread status
2. WHEN in a message thread THEN the system SHALL allow sending text messages and file attachments (PDF/images)
3. WHEN messages reference jobs or quotes THEN the system SHALL display contextual reference links
4. WHEN new messages are received THEN the system SHALL update read/unread status appropriately
5. WHEN files are attached THEN the system SHALL validate file types and sizes for security

### Requirement 4: Contract Documentation and Confirmation

**User Story:** As an organizer, I want to send formal job offers using templates or custom documents with mandatory confirmation steps, so that both parties clearly understand the terms before proceeding.

#### Acceptance Criteria

1. WHEN accessing /orders/new with a jobId THEN the system SHALL provide template selection or custom PDF upload options
2. WHEN sending a job offer THEN the system SHALL display a confirmation modal with key details (date, location, role, headcount, compensation, cancellation terms)
3. WHEN a job offer is sent THEN the system SHALL display a "Job Offer Card" pinned in the message thread
4. WHEN sending offers THEN the system SHALL require explicit confirmation through the modal before submission
5. WHEN an offer is sent THEN the system SHALL notify the nurse and update the job status

### Requirement 5: Contract Acceptance and Review

**User Story:** As a sports nurse, I want to review job offers carefully and either accept them or request changes with clear reasoning, so that I can ensure terms are acceptable before committing.

#### Acceptance Criteria

1. WHEN viewing a job offer THEN the system SHALL display "Accept" and "Request Changes" buttons
2. WHEN accepting an offer THEN the system SHALL display a confirmation modal with the same key details as the sending process
3. WHEN requesting changes THEN the system SHALL require a reason and automatically post it to the message thread
4. WHEN an offer is accepted THEN the system SHALL update the job status and trigger the escrow process
5. WHEN actions are taken THEN the system SHALL log all decisions for audit purposes

### Requirement 6: Escrow Payment System (Mock Implementation)

**User Story:** As the platform operator, I want to hold organizer payments in escrow to prevent non-payment issues and ensure nurses are compensated for completed work.

#### Acceptance Criteria

1. WHEN a job offer is accepted THEN the system SHALL initiate the escrow payment flow
2. WHEN calculating escrow amount THEN the system SHALL include total compensation plus variable platform fees
3. WHEN processing mock payments THEN the system SHALL simulate payment confirmation and set status to PAID
4. WHEN escrow is established THEN the system SHALL update job status to escrow_holding and create audit logs
5. WHEN escrow transactions occur THEN the system SHALL maintain detailed transaction records for reconciliation

### Requirement 7: Event Day Attendance Tracking

**User Story:** As both organizer and nurse, I want to track actual work hours and attendance on event day, so that compensation can be calculated accurately and any irregularities can be documented.

#### Acceptance Criteria

1. WHEN the event day arrives THEN the system SHALL provide check-in/check-out functionality at /attendance/[jobId]
2. WHEN checking in/out THEN the system SHALL optionally log timestamps and location data
3. WHEN irregularities occur THEN the system SHALL allow adding comments for overtime, early departure, or other situations
4. WHEN attendance is recorded THEN the system SHALL make this data available for final reconciliation
5. WHEN attendance tracking is complete THEN the system SHALL enable the review and payment process

### Requirement 8: Performance Evaluation and Reporting

**User Story:** As both organizer and nurse, I want to provide structured feedback and reports after job completion, so that service quality can be maintained and future matching can be improved.

#### Acceptance Criteria

1. WHEN jobs are completed THEN the system SHALL require both parties to submit evaluations at /reviews/[jobId]
2. WHEN submitting evaluations THEN the system SHALL use 5-star ratings with predefined tags (communication, emergency response, hygiene, teamwork)
3. WHEN nurses submit reports THEN the system SHALL provide templates for incident reports, responses taken, and professional observations
4. WHEN organizers submit reports THEN the system SHALL capture service satisfaction, any issues, overtime situations, and general feedback
5. WHEN both evaluations are submitted THEN the system SHALL mark the job ready for final payment processing

### Requirement 9: Final Payment Processing (Mock Implementation)

**User Story:** As the platform operator, I want to process final payments to nurses with flexible timing options, so that they can choose between immediate payment (higher fees) or scheduled payment (lower fees).

#### Acceptance Criteria

1. WHEN jobs are ready for payment THEN the system SHALL provide payment options at /admin/payouts
2. WHEN processing payments THEN the system SHALL offer instant transfer (high fees) or scheduled monthly transfer (low fees) options
3. WHEN payments are processed THEN the system SHALL simulate transfers and fee calculations in the MVP
4. WHEN payments complete THEN the system SHALL update job status to paid and create final audit logs
5. WHEN payment records are created THEN the system SHALL generate appropriate documentation for accounting purposes

### Requirement 10: Security and Audit Requirements

**User Story:** As the platform operator, I want comprehensive security measures and audit trails for all critical operations, so that the platform maintains trust and regulatory compliance.

#### Acceptance Criteria

1. WHEN handling personal information THEN the system SHALL minimize PII exposure and encrypt sensitive data
2. WHEN critical operations occur THEN the system SHALL create detailed audit logs with actor, action, target, metadata, and timestamp
3. WHEN important actions are taken THEN the system SHALL require confirmation modals with summary checklists
4. WHEN users access the platform THEN the system SHALL enforce role-based access control (admin/organizer/nurse)
5. WHEN terms are agreed THEN the system SHALL require explicit consent to terms of service and individual contracts

### Requirement 11: User Management and Authentication

**User Story:** As a platform user, I want secure account creation and management with appropriate role-based permissions, so that I can access features relevant to my role while maintaining account security.

#### Acceptance Criteria

1. WHEN registering THEN the system SHALL support email/password and OAuth authentication via NextAuth
2. WHEN creating accounts THEN the system SHALL assign appropriate roles (admin/organizer/nurse) with corresponding permissions
3. WHEN nurses register THEN the system SHALL capture license numbers, skills, and location information
4. WHEN users access features THEN the system SHALL enforce role-based access restrictions
5. WHEN profile information is updated THEN the system SHALL validate and store changes securely