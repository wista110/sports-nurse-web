import { test, expect } from "@playwright/test";
import { testDb } from "../setup/database";
import { createTestUser, createTestJob, createTestApplication } from "../setup/test-helpers";

test.describe("Contract Management", () => {
  let organizerEmail: string;
  let nurseEmail: string;
  let jobId: string;

  test.beforeEach(async () => {
    await testDb.reset();

    // Create test users
    const organizer = await createTestUser({
      email: "organizer@test.com",
      role: "ORGANIZER",
      profile: {
        name: "Test Organizer",
        city: "Tokyo",
        prefecture: "Tokyo",
        organizationName: "Test Sports Club",
        ratingCount: 0,
      },
    });

    const nurse = await createTestUser({
      email: "nurse@test.com",
      role: "NURSE",
      profile: {
        name: "Test Nurse",
        city: "Tokyo",
        prefecture: "Tokyo",
        licenseNumber: "N123456",
        skills: ["Emergency Care", "Sports Medicine"],
        ratingCount: 0,
      },
    });

    organizerEmail = organizer.email;
    nurseEmail = nurse.email;

    // Create test job with application
    const job = await createTestJob({
      organizerId: organizer.id,
      title: "Basketball Tournament Medical Support",
      description: "Medical support needed for youth basketball tournament",
      categories: ["Basketball"],
      location: {
        prefecture: "Tokyo",
        city: "Shibuya",
        venue: "Tokyo Gymnasium",
        address: "1-17-1 Sendagaya, Shibuya City, Tokyo",
      },
      startAt: new Date("2024-06-01T09:00:00Z"),
      endAt: new Date("2024-06-01T17:00:00Z"),
      headcount: 2,
      compensation: {
        type: "fixed",
        amount: 50000,
        currency: "JPY",
      },
      deadline: new Date("2024-05-25T23:59:59Z"),
      status: "APPLIED",
    });

    jobId = job.id;

    // Create application
    await createTestApplication({
      jobId: job.id,
      nurseId: nurse.id,
      message: "I'm interested in this position and have relevant experience.",
      status: "PENDING",
    });
  });

  test.afterEach(async () => {
    await testDb.cleanup();
  });

  test("organizer can create job offer with template", async ({ page }) => {
    // Login as organizer
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', organizerEmail);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to job details
    await page.goto(`/jobs/${jobId}`);
    await expect(page.locator("h1")).toContainText("Basketball Tournament Medical Support");

    // Go to messaging/inbox to create job offer
    await page.goto("/inbox");
    
    // Click on the thread for this job
    await page.click(`[data-testid="thread-${jobId}"]`);

    // Click create job offer button
    await page.click('button:has-text("Create Job Offer")');

    // Fill out job offer form
    await page.click('input[value="standard"]'); // Select standard template
    
    // Verify pre-filled terms
    await expect(page.locator('input[name="terms.location"]')).toHaveValue(
      "Tokyo Gymnasium, Shibuya, Tokyo"
    );

    // Update responsibilities
    const responsibilitiesTextarea = page.locator('textarea[placeholder*="responsibility"]');
    await responsibilitiesTextarea.clear();
    await responsibilitiesTextarea.fill([
      "Provide immediate medical care for injuries",
      "Monitor athlete health during games",
      "Maintain medical equipment and supplies",
      "Document all medical incidents"
    ].join("\n"));

    // Update cancellation policy
    await page.fill(
      'textarea[name="terms.cancellationPolicy"]',
      "Cancellation must be made at least 48 hours in advance. Late cancellations may incur a 50% fee."
    );

    // Add special requirements
    const specialRequirementsTextarea = page.locator('textarea[placeholder*="requirement"]');
    await specialRequirementsTextarea.fill([
      "Current CPR certification required",
      "Sports medicine experience preferred"
    ].join("\n"));

    // Submit the form
    await page.click('button[type="submit"]');

    // Confirm in modal
    await expect(page.locator('[role="dialog"]')).toContainText("Confirm Job Offer");
    await expect(page.locator('[role="dialog"]')).toContainText("Basketball Tournament Medical Support");
    await page.click('button:has-text("Send Offer")');

    // Verify success
    await expect(page.locator(".job-offer-card")).toBeVisible();
    await expect(page.locator(".job-offer-card")).toContainText("Job Offer");
    await expect(page.locator(".job-offer-card")).toContainText("PENDING");
  });

  test("organizer can create job offer with custom document", async ({ page }) => {
    // Login as organizer
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', organizerEmail);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to inbox and thread
    await page.goto("/inbox");
    await page.click(`[data-testid="thread-${jobId}"]`);
    await page.click('button:has-text("Create Job Offer")');

    // Upload custom document (mock file upload)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "custom-contract.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("Mock PDF content"),
    });

    // Wait for upload to complete
    await expect(page.locator("text=Document uploaded successfully")).toBeVisible();

    // Fill required terms
    await page.fill(
      'textarea[name="terms.cancellationPolicy"]',
      "Custom cancellation policy as per uploaded document"
    );

    // Submit
    await page.click('button[type="submit"]');
    await page.click('button:has-text("Send Offer")');

    // Verify job offer with custom document
    await expect(page.locator(".job-offer-card")).toContainText("Custom Contract Document");
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
  });

  test("nurse can accept job offer", async ({ page }) => {
    // First, create a job offer as organizer
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', organizerEmail);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/inbox");
    await page.click(`[data-testid="thread-${jobId}"]`);
    await page.click('button:has-text("Create Job Offer")');
    await page.click('input[value="standard"]');
    await page.click('button[type="submit"]');
    await page.click('button:has-text("Send Offer")');

    // Logout and login as nurse
    await page.goto("/auth/signout");
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', nurseEmail);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to inbox and view job offer
    await page.goto("/inbox");
    await page.click(`[data-testid="thread-${jobId}"]`);

    // Verify job offer is visible
    await expect(page.locator(".job-offer-card")).toBeVisible();
    await expect(page.locator(".job-offer-card")).toContainText("PENDING");

    // Review job offer details
    await expect(page.locator(".job-offer-card")).toContainText("Tokyo Gymnasium, Shibuya");
    await expect(page.locator(".job-offer-card")).toContainText("¥50,000");
    await expect(page.locator(".job-offer-card")).toContainText("Provide medical support during the event");

    // Accept the job offer
    await page.click('button:has-text("Accept Offer")');

    // Confirm acceptance in modal
    await expect(page.locator('[role="dialog"]')).toContainText("Accept Job Offer");
    await expect(page.locator('[role="dialog"]')).toContainText("escrow process will begin");
    await page.click('button:has-text("Accept Offer")');

    // Verify acceptance
    await expect(page.locator(".job-offer-card")).toContainText("ACCEPTED");
    await expect(page.locator(".job-offer-card")).toContainText("Accepted on");
    
    // Verify action buttons are no longer visible
    await expect(page.locator('button:has-text("Accept Offer")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Request Changes")')).not.toBeVisible();
  });

  test("nurse can request changes to job offer", async ({ page }) => {
    // Create job offer as organizer
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', organizerEmail);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/inbox");
    await page.click(`[data-testid="thread-${jobId}"]`);
    await page.click('button:has-text("Create Job Offer")');
    await page.click('input[value="standard"]');
    await page.click('button[type="submit"]');
    await page.click('button:has-text("Send Offer")');

    // Login as nurse
    await page.goto("/auth/signout");
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', nurseEmail);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to job offer
    await page.goto("/inbox");
    await page.click(`[data-testid="thread-${jobId}"]`);

    // Request changes
    await page.click('button:has-text("Request Changes")');

    // Fill change request reason
    await page.fill(
      'textarea[placeholder*="changes"]',
      "I would like to request a higher compensation rate due to my specialized sports medicine experience. Also, could we adjust the working hours to include a 30-minute break?"
    );

    await page.click('button:has-text("Send Request")');

    // Verify job offer status updated
    await expect(page.locator(".job-offer-card")).toContainText("REJECTED");
    
    // Verify change request message was sent
    await expect(page.locator(".message-bubble")).toContainText("higher compensation rate");
    await expect(page.locator(".message-bubble")).toContainText("30-minute break");
  });

  test("job offer form validation works correctly", async ({ page }) => {
    // Login as organizer
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', organizerEmail);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/inbox");
    await page.click(`[data-testid="thread-${jobId}"]`);
    await page.click('button:has-text("Create Job Offer")');

    // Try to submit without selecting template or uploading document
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator("text=Either template type or custom document URL is required")).toBeVisible();

    // Select template but clear required fields
    await page.click('input[value="standard"]');
    await page.fill('input[name="terms.location"]', "");
    await page.fill('textarea[name="terms.cancellationPolicy"]', "");

    // Clear responsibilities
    const responsibilitiesTextarea = page.locator('textarea[placeholder*="responsibility"]');
    await responsibilitiesTextarea.clear();

    await page.click('button[type="submit"]');

    // Should show field validation errors
    await expect(page.locator("text=Location is required")).toBeVisible();
    await expect(page.locator("text=Cancellation policy is required")).toBeVisible();
    await expect(page.locator("text=At least one responsibility is required")).toBeVisible();

    // Fix validation errors
    await page.fill('input[name="terms.location"]', "Tokyo Gymnasium");
    await page.fill('textarea[name="terms.cancellationPolicy"]', "24 hours notice required");
    await responsibilitiesTextarea.fill("Provide medical support");

    // Set end date before start date
    await page.fill('input[name="terms.startDate"]', "2024-06-01T18:00");
    await page.fill('input[name="terms.endDate"]', "2024-06-01T09:00");

    await page.click('button[type="submit"]');

    // Should show date validation error
    await expect(page.locator("text=End date must be after start date")).toBeVisible();
  });

  test("file upload validation works correctly", async ({ page }) => {
    // Login as organizer
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', organizerEmail);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/inbox");
    await page.click(`[data-testid="thread-${jobId}"]`);
    await page.click('button:has-text("Create Job Offer")');

    // Try to upload non-PDF file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "document.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Text content"),
    });

    // Should show file type error
    await expect(page.locator("text=Please upload a PDF file")).toBeVisible();

    // Try to upload oversized file (mock)
    await fileInput.setInputFiles({
      name: "large-document.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(6 * 1024 * 1024), // 6MB
    });

    // Should show file size error
    await expect(page.locator("text=File size must be less than 5MB")).toBeVisible();

    // Upload valid file
    await fileInput.setInputFiles({
      name: "contract.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("Valid PDF content"),
    });

    // Should show success message
    await expect(page.locator("text=Document uploaded successfully")).toBeVisible();

    // Should be able to remove uploaded file
    await page.click('button:has-text("Remove")');
    await expect(page.locator("text=Click to upload")).toBeVisible();
  });
});