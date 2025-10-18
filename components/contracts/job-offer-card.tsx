"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationModal } from "@/components/ui/modal";
import { 
  FileText, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Download
} from "lucide-react";
import type { JobOrder } from "@/types/domain";

interface JobOfferCardProps {
  jobOrder: JobOrder;
  onStatusUpdate?: () => void;
}

export function JobOfferCard({ jobOrder, onStatusUpdate }: JobOfferCardProps) {
  const { data: session } = useSession();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [updating, setUpdating] = useState(false);

  const isNurse = session?.user?.role === "NURSE";
  const canTakeAction = isNurse && jobOrder.status === "PENDING";

  const getStatusIcon = () => {
    switch (jobOrder.status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "CANCELLED":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (jobOrder.status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAccept = async () => {
    try {
      setUpdating(true);
      
      const response = await fetch(`/api/job-orders/${jobOrder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "ACCEPTED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept job offer");
      }

      onStatusUpdate?.();
      setShowAcceptModal(false);
    } catch (error) {
      console.error("Error accepting job offer:", error);
      alert("Failed to accept job offer. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      setUpdating(true);
      
      const response = await fetch(`/api/job-orders/${jobOrder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject job offer");
      }

      onStatusUpdate?.();
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting job offer:", error);
      alert("Failed to reject job offer. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Job Offer</h3>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {jobOrder.status.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Contract Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>
              {formatDate(jobOrder.terms.startDate)} - {formatDate(jobOrder.terms.endDate)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{jobOrder.terms.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span>
              {formatCurrency(jobOrder.terms.compensation.amount)} ({jobOrder.terms.compensation.type})
            </span>
          </div>
          {jobOrder.templateType && (
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span>Template: {jobOrder.templateType}</span>
            </div>
          )}
        </div>

        {/* Responsibilities */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Responsibilities:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            {jobOrder.terms.responsibilities.map((responsibility, index) => (
              <li key={index}>{responsibility}</li>
            ))}
          </ul>
        </div>

        {/* Cancellation Policy */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Cancellation Policy:</h4>
          <p className="text-sm text-gray-600">{jobOrder.terms.cancellationPolicy}</p>
        </div>

        {/* Special Requirements */}
        {jobOrder.terms.specialRequirements && jobOrder.terms.specialRequirements.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Special Requirements:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {jobOrder.terms.specialRequirements.map((requirement, index) => (
                <li key={index}>{requirement}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Custom Document */}
        {jobOrder.customDocumentUrl && (
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Custom Contract Document</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(jobOrder.customDocumentUrl, "_blank")}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        )}

        {/* Actions */}
        {canTakeAction && (
          <div className="flex space-x-3 pt-2 border-t border-blue-200">
            <Button
              onClick={() => setShowAcceptModal(true)}
              className="flex-1"
              disabled={updating}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Offer
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(true)}
              className="flex-1"
              disabled={updating}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Request Changes
            </Button>
          </div>
        )}

        {/* Status Information */}
        {jobOrder.status === "ACCEPTED" && jobOrder.acceptedAt && (
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
            Accepted on {formatDate(jobOrder.acceptedAt)}
          </div>
        )}
      </div>

      {/* Accept Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onConfirm={handleAccept}
        title="Accept Job Offer"
        message={`Are you sure you want to accept this job offer? By accepting, you agree to the terms and conditions outlined above. The escrow process will begin once you accept.`}
        confirmText="Accept Offer"
        loading={updating}
      />

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRejectModal(false)} />
            <div className="relative w-full max-w-md transform rounded-lg bg-white shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Changes</h3>
                <p className="text-gray-600 mb-4">
                  Please explain what changes you would like to request for this job offer:
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                  placeholder="Describe the changes you would like to request..."
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason("");
                    }}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={updating || !rejectionReason.trim()}
                  >
                    {updating ? "Sending..." : "Send Request"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}