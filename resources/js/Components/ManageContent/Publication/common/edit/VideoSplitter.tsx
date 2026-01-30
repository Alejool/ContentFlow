import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import Button from "@/Components/common/Modern/Button";
import { SOCIAL_PLATFORMS } from "@/Constants/socialPlatforms";
import axios from "axios";
import {
  Eye,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Scissors,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Segment {
  id: string;
  start: number;
  end: number;
  platformLabel?: string;
  color?: string; // For visualization
}

interface VideoSplitterProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile?: File;
  videoUrl?: string;
  initialSegments?: Segment[];
  onSplitComplete: (
    newFiles: File[],
    mode: "replace" | "new_publications",
    segmentsConfig?: Segment[],
  ) => void;
  selectedPlatforms?: string[];
}

const SEGMENT_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
];

const PRESETS = [
  { label: "TikTok / Reels / Shorts (60s)", duration: 60, name: "Short Form" },
  { label: "Stories (15s)", duration: 15, name: "Stories" },
  { label: "Stories (60s)", duration: 60, name: "Long Stories" },
  { label: "Twitter / X (140s)", duration: 140, name: "Twitter" },
];

export default function VideoSplitter({
  isOpen,
  onClose,
  videoFile,
  videoUrl,
  initialSegments,
  onSplitComplete,
  selectedPlatforms = [],
}: VideoSplitterProps) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [segments, setSegments] = useState<Segment[]>(
    initialSegments || [{ id: "1", start: 0, end: 0 }],
  );
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(
    0,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false); // New: Preview Mode
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize
  useEffect(() => {
    let source: string | null = null;
    const loadVideo = async () => {
      if (videoRef.current && (videoFile || videoUrl)) {
        source = videoFile ? URL.createObjectURL(videoFile) : videoUrl!;
        videoRef.current.src = source;
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;
          const d = videoRef.current.duration;
          setDuration(d);
          if (!initialSegments) {
            setSegments([{ id: "1", start: 0, end: Math.min(d, 60) }]);
          }
        };
        videoRef.current.onerror = () => {
          toast.error(t("common.errors.video_load") || "Error al cargar video");
          onClose();
        };
      }
    };

    if (isOpen) {
      if (!videoFile && !videoUrl) {
        onClose();
      } else {
        loadVideo();
      }
    }

    return () => {
      if (source && videoFile) URL.revokeObjectURL(source);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (previewIntervalRef.current) clearInterval(previewIntervalRef.current);
    };
  }, [isOpen, videoFile, videoUrl, onClose, initialSegments, t]);

  // Play/Pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPreviewing(false); // Stop preview loop if paused manually
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Preview Logic
  const startPreview = () => {
    if (!videoRef.current || segments.length === 0) return;

    // Sort segments by start time
    const sortedSegments = [...segments].sort((a, b) => a.start - b.start);

    // Start from the beginning of the first segment if we are outside
    let startSegment = sortedSegments.find(
      (s) => currentTime >= s.start && currentTime < s.end,
    );
    if (!startSegment) {
      startSegment = sortedSegments[0];
      videoRef.current.currentTime = startSegment.start;
    }

    setIsPreviewing(true);
    videoRef.current.play();
    setIsPlaying(true);

    // Monitoring loop for skipping
    if (previewIntervalRef.current) clearInterval(previewIntervalRef.current);

    previewIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !setIsPreviewing) return;
      const curr = videoRef.current.currentTime;

      // Find which segment we are currently "in" or "passed"
      const currentSegIdx = sortedSegments.findIndex(
        (s) => curr >= s.start && curr < s.end,
      );

      if (currentSegIdx !== -1) {
        // We are inside a valid segment, nice.
      } else {
        // We are in a "gap". Find next segment.
        const nextSeg = sortedSegments.find((s) => s.start > curr);
        if (nextSeg) {
          // Jump to next segment
          videoRef.current.currentTime = nextSeg.start;
        } else {
          // End of all segments
          videoRef.current.pause();
          setIsPlaying(false);
          setIsPreviewing(false);
          if (previewIntervalRef.current)
            clearInterval(previewIntervalRef.current);
          // Loop back to start?
          // videoRef.current.currentTime = sortedSegments[0].start;
        }
      }
    }, 100);
  };

  const stopPreview = () => {
    setIsPreviewing(false);
    if (previewIntervalRef.current) clearInterval(previewIntervalRef.current);
    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const seekTo = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    seekTo(percent * duration);
  };

  // Segment Management
  const addSegment = () => {
    const lastSeg = segments[segments.length - 1];
    const newStart = lastSeg ? lastSeg.end : 0;
    // Default 15s or until end
    const newEnd = Math.min(duration, newStart + 15);

    if (newStart >= duration) {
      toast.error("No hay más video para recortar");
      return;
    }

    setSegments([
      ...segments,
      {
        id: Date.now().toString(),
        start: newStart,
        end: newEnd,
        platformLabel: suggestPlatformForDuration(newEnd - newStart),
      },
    ]);
    setActiveSegmentIndex(segments.length); // Select new

    const platform = suggestPlatformForDuration(newEnd - newStart);
    if (platform) {
      toast.success(`Segmento agregado. Recomendado para: ${platform}`, {
        icon: "📱",
      });
    }
  };

  const updateSegment = (index: number, updates: Partial<Segment>) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], ...updates };
    setSegments(newSegments);
  };

  const deleteSegment = (index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
    if (activeSegmentIndex === index) setActiveSegmentIndex(null);
  };

  const applyPreset = (presetDuration: number) => {
    // Auto-chop the whole video
    const newSegments: Segment[] = [];
    let currentStart = 0;
    let count = 1;

    // Clear existing
    while (currentStart < duration) {
      const end = Math.min(duration, currentStart + presetDuration);
      newSegments.push({
        id: `auto-${count}`,
        start: currentStart,
        end,
        platformLabel: suggestPlatformForDuration(end - currentStart),
      });
      currentStart = end;
      count++;
    }
    setSegments(newSegments);
    toast.success(`Se crearon ${newSegments.length} segmentos automáticamente`);
  };

  const suggestPlatformForDuration = (dur: number) => {
    if (selectedPlatforms.length === 0) return undefined;
    // Simple heuristic
    for (const key of selectedPlatforms) {
      const p = SOCIAL_PLATFORMS[key];
      if (p && (!p.maxVideoDuration || dur <= p.maxVideoDuration))
        return p.name;
    }
    return undefined;
  };

  // Backend Processing
  const handleProcess = async (mode: "replace" | "new_publications") => {
    // Logic same as before but respecting segments
    if (!videoFile && !videoUrl) return;

    setProcessing(true);
    setProgress(0);

    try {
      const response = await axios.post("/api/v1/video/process", {
        operation: "trim",
        input_path:
          videoUrl || (videoFile ? URL.createObjectURL(videoFile) : ""),
        parameters: {
          segments: segments.map((seg) => ({
            start: seg.start,
            end: seg.end,
          })),
        },
      });

      const newJobId = response.data.job.id;
      setJobId(newJobId);

      // Start polling
      pollIntervalRef.current = setInterval(() => {
        pollJobStatus(newJobId, mode);
      }, 2000);

      toast.success(t("common.processing") || "Procesando...");
    } catch (error) {
      console.error("Error processing:", error);
      toast.error(t("common.errors.processing_failed") || "Error en proceso");
      setProcessing(false);
    }
  };

  const pollJobStatus = async (
    id: number,
    mode: "replace" | "new_publications",
  ) => {
    try {
      const response = await axios.get(`/api/v1/video/process/${id}`);
      const job = response.data.job;
      setProgress(job.progress || 0);

      if (job.status === "completed") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        const files: File[] = [];
        for (let i = 0; i < job.output_paths.length; i++) {
          const url = job.output_paths[i];
          const res = await fetch(url);
          const blob = await res.blob();
          const fileName = `segment_${i + 1}.mp4`;
          files.push(new File([blob], fileName, { type: "video/mp4" }));
        }

        toast.success(t("publications.modal.publish.splitSuccess") || "Listo!");
        onSplitComplete(files, mode, segments);
        onClose();
        setProcessing(false);
      } else if (job.status === "failed") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        toast.error(job.error_message || "Falló el procesamiento");
        setProcessing(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader
          t={t}
          title={
            t("publications.modal.publish.videoSplitter") ||
            "Editor de Recortes"
          }
          onClose={onClose}
        />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Visualizer & Controls */}
          <div className="flex-1 flex flex-col p-4 bg-neutral-100 dark:bg-neutral-950/50 overflow-hidden relative">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-lg shadow-lg overflow-hidden flex-shrink-0 group">
              <video
                ref={videoRef}
                className={`w-full h-full object-contain ${processing ? "opacity-50" : ""}`}
                onTimeUpdate={(e) =>
                  setCurrentTime((e.target as HTMLVideoElement).currentTime)
                }
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  setIsPreviewing(false);
                }}
              />

              {/* Overlay Controls */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-full text-white pointer-events-auto transition-transform hover:scale-110"
                >
                  {isPlaying ? (
                    <Pause size={32} fill="currentColor" />
                  ) : (
                    <Play size={32} fill="currentColor" />
                  )}
                </button>
              </div>

              {isPreviewing && (
                <div className="absolute top-4 left-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-2 animate-pulse">
                  <Eye size={12} /> VISTA PREVIA
                </div>
              )}
            </div>

            {/* Timeline Visualizer */}
            <div className="mt-6 px-2 select-none">
              <div className="flex justify-between text-xs text-neutral-500 mb-1 font-mono">
                <span>00:00</span>
                <span>{Math.floor(currentTime)}s</span>
                <span>
                  {Math.floor(duration / 60)}:
                  {String(Math.floor(duration % 60)).padStart(2, "0")}
                </span>
              </div>

              <div
                ref={progressRef}
                className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
                onClick={handleTimelineClick}
              >
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 shadow-[0_0_10px_rgba(239,68,68,0.5)] pointer-events-none transition-all duration-75"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-sm" />
                </div>

                {/* Segments Visualization */}
                {segments.map((seg, idx) => (
                  <div
                    key={seg.id}
                    className={`absolute top-1 bottom-1 rounded-md opacity-80 hover:opacity-100 transition-all border border-black/10 dark:border-white/10
                                    ${activeSegmentIndex === idx ? "ring-2 ring-white z-20 shadow-lg" : "z-10"}
                                    ${SEGMENT_COLORS[idx % SEGMENT_COLORS.length]}
                                `}
                    style={{
                      left: `${(seg.start / duration) * 100}%`,
                      width: `${((seg.end - seg.start) / duration) * 100}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSegmentIndex(idx);
                      seekTo(seg.start);
                    }}
                    title={`Segmento ${idx + 1}: ${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s`}
                  >
                    <div className="hidden sm:flex items-center justify-center h-full text-[10px] font-bold text-white tracking-wider truncate px-1 shadow-sm">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transport Controls */}
            <div className="mt-4 flex flex-wrap gap-2 justify-between items-center bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={isPreviewing ? stopPreview : startPreview}
                  className={
                    isPreviewing
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                      : ""
                  }
                >
                  {isPreviewing ? (
                    <Pause size={14} className="mr-2" />
                  ) : (
                    <Eye size={14} className="mr-2" />
                  )}
                  {isPreviewing ? "Parar Preview" : "Vista Previa Crud"}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={addSegment}
                  size="sm"
                  variant="secondary"
                  className="border-dashed border-2 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Plus size={14} className="mr-2" /> Agregar Corte
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Settings & List */}
          <div className="w-full lg:w-96 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950/30">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Configuración
              </h3>

              {/* Auto-Split Dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  <RefreshCw size={12} /> Auto-Split
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 p-1 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
                  {PRESETS.map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        applyPreset(p.duration);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {segments.length === 0 && (
                <div className="text-center py-10 text-neutral-400">
                  <Scissors size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Agrega segmentos o usa Auto-Split</p>
                </div>
              )}

              {segments.map((seg, idx) => (
                <div
                  key={seg.id}
                  className={`
                                relative p-3 rounded-xl border-2 transition-all duration-200 group
                                ${
                                  activeSegmentIndex === idx
                                    ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-md scale-[1.02]"
                                    : "border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700"
                                }
                            `}
                  onClick={() => setActiveSegmentIndex(idx)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${SEGMENT_COLORS[idx % SEGMENT_COLORS.length]}`}
                      />
                      <span className="font-bold text-sm text-neutral-700 dark:text-neutral-200">
                        #{idx + 1}
                      </span>
                      <span className="text-xs text-neutral-400 ml-1">
                        {(seg.end - seg.start).toFixed(1)}s
                      </span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSegment(idx);
                        }}
                        className="text-red-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase font-bold">
                        Inicio
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded bg-transparent focus:ring-1 focus:ring-primary-500"
                        value={seg.start}
                        onChange={(e) =>
                          updateSegment(idx, { start: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase font-bold">
                        Fin
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded bg-transparent focus:ring-1 focus:ring-primary-500"
                        value={seg.end}
                        onChange={(e) =>
                          updateSegment(idx, { end: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>

                  {selectedPlatforms.length > 0 && (
                    <div className="mt-2">
                      <select
                        className={`w-full text-xs px-2 py-1 rounded border bg-transparent ${
                          seg.platformLabel && seg.platformLabel.includes("⚠️")
                            ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                            : "border-neutral-200 dark:border-neutral-700"
                        }`}
                        value={seg.platformLabel || ""}
                        onChange={(e) =>
                          updateSegment(idx, { platformLabel: e.target.value })
                        }
                      >
                        <option value="">Sin plataforma</option>
                        {selectedPlatforms.map((pk) => {
                          const p = SOCIAL_PLATFORMS[pk];
                          if (!p) return null;
                          const valid =
                            !p.maxVideoDuration ||
                            seg.end - seg.start <= p.maxVideoDuration;
                          return (
                            <option key={pk} value={p.name}>
                              {p.name} {valid ? "" : "⚠️"}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Processing Status */}
            {processing && (
              <div className="p-4 bg-primary-50 dark:bg-primary-900/10 border-t border-primary-100 dark:border-primary-900/20">
                <div className="flex items-center gap-2 mb-1 text-primary-700 dark:text-primary-300">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-semibold">
                    Procesando {progress}%...
                  </span>
                </div>
                <div className="h-1 bg-primary-200 dark:bg-primary-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/30 gap-2 flex flex-col">
              <Button
                onClick={() => handleProcess("new_publications")}
                disabled={processing || segments.length === 0}
                className="w-full shadow-lg shadow-primary-500/10"
              >
                {processing ? (
                  "Procesando..."
                ) : (
                  <>
                    <Save size={16} className="mr-2" /> Guardar como Nuevos
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                disabled={processing}
                className="w-full text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
