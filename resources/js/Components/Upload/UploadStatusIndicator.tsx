import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Progress } from "@/Components/ui/progress";
import { useProcessingProgress } from "@/stores/processingProgressStore";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface UploadStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const UploadStatusIndicator: React.FC<UploadStatusIndicatorProps> = ({
  className = "",
  showDetails = false,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const { queue, retryUpload, cancelUpload, removeUpload } = useUploadQueue();
  const { jobs } = useProcessingProgress();

  const uploads = Object.values(queue);
  const processingJobs = Object.values(jobs);

  const activeUploads = uploads.filter(
    (u) => u.status === "uploading" || u.status === "pending",
  );
  const failedUploads = uploads.filter((u) => u.status === "error");
  const completedUploads = uploads.filter((u) => u.status === "completed");

  const activeProcessing = processingJobs.filter(
    (j) => j.status === "processing" || j.status === "queued",
  );
  const failedProcessing = processingJobs.filter((j) => j.status === "failed");

  const totalActive = activeUploads.length + activeProcessing.length;
  const totalFailed = failedUploads.length + failedProcessing.length;
  const totalCompleted = completedUploads.length;

  // Auto-expand when there are active or failed items
  useEffect(() => {
    if (totalActive > 0 || totalFailed > 0) {
      setIsExpanded(true);
    }
  }, [totalActive, totalFailed]);

  // Auto-collapse after all uploads complete (with delay)
  useEffect(() => {
    if (totalActive === 0 && totalFailed === 0 && totalCompleted > 0) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [totalActive, totalFailed, totalCompleted]);

  if (uploads.length === 0 && processingJobs.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Upload className="h-4 w-4 animate-spin" />;
      case "pending":
      case "queued":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploading":
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "pending":
      case "queued":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "error":
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatFileSize(bytesPerSecond) + "/s";
  };

  const formatETA = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const handleRetry = (uploadId: string) => {
    retryUpload(uploadId);
    toast.success("Retrying upload...");
  };

  const handleCancel = (uploadId: string) => {
    cancelUpload(uploadId);
    toast.success("Upload cancelled");
  };

  const handleRemove = (uploadId: string) => {
    removeUpload(uploadId);
  };

  return (
    <Card className={`fixed bottom-4 right-4 w-96 z-50 shadow-lg ${className}`}>
      <CardHeader
        className="pb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Status
            {totalActive > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalActive} active
              </Badge>
            )}
            {totalFailed > 0 && (
              <Badge variant="destructive" className="ml-1">
                {totalFailed} failed
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <X className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {/* Active Uploads */}
            {activeUploads.map((upload) => (
              <div key={upload.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(upload.status)}
                    <span className="text-sm font-medium truncate max-w-48">
                      {upload.file.name}
                    </span>
                  </div>
                  <Badge className={getStatusColor(upload.status)}>
                    {upload.status}
                  </Badge>
                </div>

                <Progress value={upload.progress} className="mb-2" />

                <div className="flex justify-between text-xs text-gray-500">
                  <span>{upload.progress}%</span>
                  <div className="flex gap-4">
                    {upload.stats?.speed && upload.stats.speed > 0 && (
                      <span>{formatSpeed(upload.stats.speed)}</span>
                    )}
                    {upload.stats?.eta && upload.stats.eta > 0 && (
                      <span>ETA: {formatETA(upload.stats.eta)}</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-1 mt-2">
                  {upload.isPausable && upload.status === "uploading" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        /* TODO: implement pause */
                      }}
                    >
                      Pause
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(upload.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}

            {/* Failed Uploads */}
            {failedUploads.map((upload) => (
              <div
                key={upload.id}
                className="border border-red-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(upload.status)}
                    <span className="text-sm font-medium truncate max-w-48">
                      {upload.file.name}
                    </span>
                  </div>
                  <Badge className={getStatusColor(upload.status)}>
                    Failed
                  </Badge>
                </div>

                {upload.error && (
                  <p className="text-xs text-red-600 mb-2">{upload.error}</p>
                )}

                <div className="flex justify-end gap-1">
                  {upload.canRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetry(upload.id)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(upload.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            {/* Active Processing Jobs */}
            {activeProcessing.map((job) => (
              <div key={job.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span className="text-sm font-medium">
                      Processing Media
                    </span>
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </div>

                <Progress value={job.progress} className="mb-2" />

                <div className="flex justify-between text-xs text-gray-500">
                  <span>{job.progress}%</span>
                  {job.stats?.eta && job.stats.eta > 0 && (
                    <span>ETA: {formatETA(job.stats.eta)}</span>
                  )}
                </div>

                {job.stats?.currentStep && (
                  <p className="text-xs text-gray-600 mt-1">
                    {job.stats.currentStep}
                  </p>
                )}
              </div>
            ))}

            {/* Completed Uploads (show briefly) */}
            {completedUploads.slice(-3).map((upload) => (
              <div
                key={upload.id}
                className="border border-green-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(upload.status)}
                    <span className="text-sm font-medium truncate max-w-48">
                      {upload.file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(upload.status)}>
                      Completed
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleRemove(upload.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default UploadStatusIndicator;
