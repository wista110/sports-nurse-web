"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmationModal } from "@/components/ui/modal";
import { Upload, FileText, Calendar, MapPin, Users, DollarSign } from "lucide-react";
import { createJobOrderSchema, type CreateJobOrderInput } from "@/lib/validations/contract";
import type { Job } from "@/types/domain";

interface JobOfferFormProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CONTRACT_TEMPLATES = [
  { value: "standard", label: "Standard Sports Nurse Contract" },
  { value: "event", label: "Event-Specific Contract" },
  { value: "emergency", label: "Emergency Response Contract" },
];

export function JobOfferForm({ job, isOpen, onClose, onSuccess }: JobOfferFormProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [customDocumentUrl, setCustomDocumentUrl] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateJobOrderInput>({
    resolver: zodResolver(createJobOrderSchema),
    defaultValues: {
      jobId: job.id,
      terms: {
        startDate: job.startAt,
        endDate: job.endAt,
        location: `${job.location.venue}, ${job.location.city}, ${job.location.prefecture}`,
        compensation: job.compensation,
        responsibilities: [
          "Provide medical support during the event",
          "Monitor athlete health and safety",
          "Respond to medical emergencies",
          "Maintain medical records and incident reports",
        ],
        cancellationPolicy: "Cancellation must be made at least 24 hours in advance. Late cancellations may incur fees.",
      },
    },
  });

  const watchedTemplateType = watch("templateType");
  const watchedTerms = watch("terms");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("pdf")) {
      alert("Please upload a PDF file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      setUploadingDocument(true);
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "contract");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await response.json();
      setCustomDocumentUrl(url);
      setValue("customDocumentUrl", url);
      setValue("templateType", undefined);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleTemplateSelect = (templateType: string) => {
    setValue("templateType", templateType);
    setCustomDocumentUrl("");
    setValue("customDocumentUrl", undefined);
  };

  const onSubmit = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      
      const formData = watch();
      const response = await fetch("/api/job-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create job offer");
      }

      onSuccess();
      reset();
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Error creating job offer:", error);
      alert("Failed to create job offer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Create Job Offer" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Job Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Job Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>
                  {new Date(job.startAt).toLocaleDateString()} - {new Date(job.endAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{job.location.city}, {job.location.prefecture}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{job.headcount} nurse{job.headcount > 1 ? "s" : ""} needed</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span>{formatCurrency(job.compensation.amount)} ({job.compensation.type})</span>
              </div>
            </div>
          </div>

          {/* Contract Document Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Contract Document</Label>
            
            {/* Template Selection */}
            <div className="space-y-3">
              <Label className="text-sm">Use Template</Label>
              <div className="grid grid-cols-1 gap-2">
                {CONTRACT_TEMPLATES.map((template) => (
                  <label
                    key={template.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      watchedTemplateType === template.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={template.value}
                      checked={watchedTemplateType === template.value}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="sr-only"
                    />
                    <FileText className="h-4 w-4 text-gray-500 mr-3" />
                    <span className="text-sm">{template.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Document Upload */}
            <div className="space-y-3">
              <Label className="text-sm">Or Upload Custom Document</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {customDocumentUrl ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="text-sm text-green-600">Document uploaded successfully</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomDocumentUrl("");
                        setValue("customDocumentUrl", undefined);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <div>
                      <label className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">
                          {uploadingDocument ? "Uploading..." : "Click to upload"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          disabled={uploadingDocument}
                          className="sr-only"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PDF files only, max 5MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Contract Terms</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register("terms.startDate", { valueAsDate: true })}
                  className={errors.terms?.startDate ? "border-red-500" : ""}
                />
                {errors.terms?.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.terms.startDate.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register("terms.endDate", { valueAsDate: true })}
                  className={errors.terms?.endDate ? "border-red-500" : ""}
                />
                {errors.terms?.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.terms.endDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register("terms.location")}
                className={errors.terms?.location ? "border-red-500" : ""}
              />
              {errors.terms?.location && (
                <p className="text-red-500 text-sm mt-1">{errors.terms.location.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                value={watchedTerms?.responsibilities?.join("\n") || ""}
                onChange={(e) => {
                  const responsibilities = e.target.value.split("\n").filter(r => r.trim());
                  setValue("terms.responsibilities", responsibilities);
                }}
                rows={4}
                className={errors.terms?.responsibilities ? "border-red-500" : ""}
                placeholder="Enter each responsibility on a new line"
              />
              {errors.terms?.responsibilities && (
                <p className="text-red-500 text-sm mt-1">{errors.terms.responsibilities.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Textarea
                id="cancellationPolicy"
                {...register("terms.cancellationPolicy")}
                rows={3}
                className={errors.terms?.cancellationPolicy ? "border-red-500" : ""}
              />
              {errors.terms?.cancellationPolicy && (
                <p className="text-red-500 text-sm mt-1">{errors.terms.cancellationPolicy.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="specialRequirements">Special Requirements (Optional)</Label>
              <Textarea
                id="specialRequirements"
                value={watchedTerms?.specialRequirements?.join("\n") || ""}
                onChange={(e) => {
                  const requirements = e.target.value.split("\n").filter(r => r.trim());
                  setValue("terms.specialRequirements", requirements.length > 0 ? requirements : undefined);
                }}
                rows={2}
                placeholder="Enter each requirement on a new line"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadingDocument}>
              Create Job Offer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Job Offer"
        message={`Are you sure you want to send this job offer for "${job.title}"? The nurse will be notified and can accept or request changes.`}
        confirmText="Send Offer"
        loading={submitting}
      />
    </>
  );
}