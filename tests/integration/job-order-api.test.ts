import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { testDb } from "../setup/database";
import { createTestUser, createTestJob } from "../setup/test-helpers";
import type { User, Job } from "@/types/domain";

describe("Job Order API Integration Tests", () => {
  let organizer: User;
  let nurse: User;
  let job: Job;

  beforeEach(async () => {
    await testDb.reset();
    
    // Create test users
    organizer = await createTestUser({
      email: "organizer@test.com",
      role: "ORGANIZER",
      profile: {
        name: "Test Organizer",
        city: "Tokyo",
        prefecture: "Tokyo",
        ratingCount: 0,
      },
    });

    nurse = await createTestUser({
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

    // Create test job
    job = await createTestJob({
      organizerId: organizer.id,
      title: "Sports Event Medical Support",
      description: "Medical support for basketball tournament",
      categories: ["Basketball"],
      location: {
        prefecture: "Tokyo",
        city: "Shibuya",
        venue: "Tokyo Gymnasium",
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
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe("POST /api/job-orders", () => {
    it("should create a job order with template", async () => {
      const jobOrderData = {
        jobId: job.id,
        templateType: "standard",
        terms: {
          startDate: job.startAt,
          endDate: job.endAt,
          location: `${job.location.venue}, ${job.location.city}`,
          compensation: job.compensation,
          responsibilities: [
            "Provide medical support during the event",
            "Monitor athlete health and safety",
          ],
          cancellationPolicy: "24 hours notice required",
        },
      };

      const response = await fetch("/api/job-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${organizer.id}`, // Mock auth
        },
        body: JSON.stringify(jobOrderData),
      });

      expect(response.status).toBe(200);
      
      const jobOrder = await response.json();
      expect(jobOrder).toMatchObject({
        jobId: job.id,
        templateType: "standard",
        status: "PENDING",
        terms: expect.objectContaining({
          location: jobOrderData.terms.location,
          responsibilities: jobOrderData.terms.responsibilities,
        }),
      });
      expect(jobOrder.id).toBeDefined();
      expect(jobOrder.createdAt).toBeDefined();
    });

    it("should create a job order with custom document", async () => {
      const jobOrderData = {
        jobId: job.id,
        customDocumentUrl: "https://example.com/contract.pdf",
        terms: {
          startDate: job.startAt,
          endDate: job.endAt,
          location: `${job.location.venue}, ${job.location.city}`,
          compensation: job.compensation,
          responsibilities: ["Provide medical support"],
          cancellationPolicy: "24 hours notice required",
        },
      };

      const response = await fetch("/api/job-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${organizer.id}`,
        },
        body: JSON.stringify(jobOrderData),
      });

      expect(response.status).toBe(200);
      
      const jobOrder = await response.json();
      expect(jobOrder).toMatchObject({
        jobId: job.id,
        customDocumentUrl: "https://example.com/contract.pdf",
        status: "PENDING",
      });
    });

    it("should reject job order creation by non-organizer", async () => {
      const jobOrderData = {
        jobId: job.id,
        templateType: "standard",
        terms: {
          startDate: job.startAt,
          endDate: job.endAt,
          location: "Test Location",
          compensation: job.compensation,
          responsibilities: ["Test responsibility"],
          cancellationPolicy: "Test policy",
        },
      };

      const response = await fetch("/api/job-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nurse.id}`,
        },
        body: JSON.stringify(jobOrderData),
      });

      expect(response.status).toBe(403);
    });

    it("should reject job order with invalid data", async () => {
      const invalidJobOrderData = {
        jobId: job.id,
        // Missing template or custom document
        terms: {
          startDate: job.startAt,
          endDate: job.endAt,
          location: "",
          compensation: job.compensation,
          responsibilities: [],
          cancellationPolicy: "",
        },
      };

      const response = await fetch("/api/job-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${organizer.id}`,
        },
        body: JSON.stringify(invalidJobOrderData),
      });

      expect(response.status).toBe(400);
      
      const error = await response.json();
      expect(error.error).toBe("Validation failed");
    });
  });

  describe("GET /api/job-orders", () => {
    it("should get job order by job ID", async () => {
      // First create a job order
      const jobOrderData = {
        jobId: job.id,
        templateType: "standard",
        terms: {
          startDate: job.startAt,
          endDate: job.endAt,
          location: "Test Location",
          compensation: job.compensation,
          responsibilities: ["Test responsibility"],
          cancellationPolicy: "Test policy",
        },
      };

      await fetch("/api/job-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${organizer.id}`,
        },
        body: JSON.stringify(jobOrderData),
      });

      // Then get it
      const response = await fetch(`/api/job-orders?jobId=${job.id}`, {
        headers: {
          "Authorization": `Bearer ${organizer.id}`,
        },
      });

      expect(response.status).toBe(200);
      
      const jobOrder = await response.json();
      expect(jobOrder).toMatchObject({
        jobId: job.id,
        templateType: "standard",
        status: "PENDING",
      });
    });

    it("should return null for non-existent job order", async () => {
      const response = await fetch(`/api/job-orders?jobId=non-existent`, {
        headers: {
          "Authorization": `Bearer ${organizer.id}`,
        },
      });

      expect(response.status).toBe(200);
      
      const jobOrder = await response.json();
      expect(jobOrder).toBeNull();
    });

    it("should reject request without job ID", async () => {
      const response = await fetch("/api/job-orders", {
        headers: {
          "Authorization": `Bearer ${organizer.id}`,
        },
      });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/job-orders/[id]", () => {
    let jobOrderId: string;

    beforeEach(async () => {
      // Create a job order for testing
      const jobOrderData = {
        jobId: job.id,
        templateType: "standard",
        terms: {
          startDate: job.startAt,
          endDate: job.endAt,
          location: "Test Location",
          compensation: job.compensation,
          responsibilities: ["Test responsibility"],
          cancellationPolicy: "Test policy",
        },
      };

      const response = await fetch("/api/job-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${organizer.id}`,
        },
        body: JSON.stringify(jobOrderData),
      });

      const jobOrder = await response.json();
      jobOrderId = jobOrder.id;
    });

    it("should accept job order", async () => {
      const response = await fetch(`/api/job-orders/${jobOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nurse.id}`,
        },
        body: JSON.stringify({
          status: "ACCEPTED",
        }),
      });

      expect(response.status).toBe(200);
      
      const updatedJobOrder = await response.json();
      expect(updatedJobOrder.status).toBe("ACCEPTED");
      expect(updatedJobOrder.acceptedAt).toBeDefined();
    });

    it("should reject job order with reason", async () => {
      const response = await fetch(`/api/job-orders/${jobOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nurse.id}`,
        },
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason: "Terms not acceptable",
        }),
      });

      expect(response.status).toBe(200);
      
      const updatedJobOrder = await response.json();
      expect(updatedJobOrder.status).toBe("REJECTED");
    });

    it("should reject job order update by non-nurse", async () => {
      const response = await fetch(`/api/job-orders/${jobOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${organizer.id}`,
        },
        body: JSON.stringify({
          status: "ACCEPTED",
        }),
      });

      expect(response.status).toBe(403);
    });

    it("should reject rejection without reason", async () => {
      const response = await fetch(`/api/job-orders/${jobOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nurse.id}`,
        },
        body: JSON.stringify({
          status: "REJECTED",
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/job-orders/[id]", () => {
    let jobOrderId: string;

    beforeEach(async () => {
      // Create a job order for testing
      const jobOrderData = {
        jobId: job.id,
        templateType: "standard",
        terms: {
          startDate: job.startAt,
          endDate: job.endAt,
          location: "Test Location",
          compensation: job.compensation,
          responsibilities: ["Test responsibility"],
          cancellationPolicy: "Test policy",
        },
      };

      const response = await fetch("/api/job-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${organizer.id}`,
        },
        body: JSON.stringify(jobOrderData),
      });

      const jobOrder = await response.json();
      jobOrderId = jobOrder.id;
    });

    it("should get job order by ID", async () => {
      const response = await fetch(`/api/job-orders/${jobOrderId}`, {
        headers: {
          "Authorization": `Bearer ${organizer.id}`,
        },
      });

      expect(response.status).toBe(200);
      
      const jobOrder = await response.json();
      expect(jobOrder).toMatchObject({
        id: jobOrderId,
        jobId: job.id,
        templateType: "standard",
        status: "PENDING",
      });
    });

    it("should return 404 for non-existent job order", async () => {
      const response = await fetch("/api/job-orders/non-existent", {
        headers: {
          "Authorization": `Bearer ${organizer.id}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });
});