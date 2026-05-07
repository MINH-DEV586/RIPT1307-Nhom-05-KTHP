import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getPatientLabResults, updateLabResult } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BrainCircuit,
  Scan,
  Loader2,
  Stethoscope,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import XRayUploadModal from "../XRayUploadModal";
import Loader from "@/components/global/Loader";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { LabResult } from "@/types";
import { socket } from "@/lib/socket";

const Radiology = ({ patientId }: { patientId: string }) => {
  const { data: session } = authClient.useSession();
  const isDoctor =
    session?.user?.role === "doctor" || session?.user?.role === "admin";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [notesContent, setNotesContent] = useState("");

  const {
    data: xrays,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["lab-results", patientId],
    queryFn: () => getPatientLabResults(patientId),
  });

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleLabUpdate = () => refetch();

    socket.on("lab_result_added", handleLabUpdate);
    socket.on("lab_result_updated", handleLabUpdate);

    return () => {
      socket.off("lab_result_added", handleLabUpdate);
      socket.off("lab_result_updated", handleLabUpdate);
    };
  }, [refetch]);

  const updateNotesMutation = useMutation({
    mutationFn: updateLabResult,
    onSuccess: () => {
      toast.success("Đã lưu ghi chú thành công");
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Không thể lưu ghi chú");
    },
  });

  const startEditing = (xray: LabResult) => {
    setEditingId(xray._id);
    setNotesContent(xray.doctorNotes || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNotesContent("");
  };

  const saveNotes = (xrayId: string) => {
    updateNotesMutation.mutate({
      id: xrayId,
      data: {
        doctorNotes: notesContent,
        status: "reviewed",
      },
    });
  };

  const statusTranslations: Record<string, string> = {
    pending: "Chờ xử lý",
    analyzed: "Đã phân tích",
    reviewed: "Đã xem xét",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Scan className="h-4 w-4" /> Phim chụp gần đây
        </h3>
        <XRayUploadModal patientId={patientId} />
      </div>
      {isLoading ? (
        <Loader label="Đang tải..." />
      ) : !xrays || xrays.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-10 border rounded-lg border-dashed">
          Không có phim chụp nào cho bệnh nhân này.
        </p>
      ) : (
        xrays.map((xray) => (
          <Card key={xray._id} className="overflow-hidden text-shadow-sm">
            <div className="relative h-48 bg-black w-full flex items-center justify-center">
              <img
                src={xray.imageUrl}
                alt={xray.bodyPart}
                className="h-full object-contain opacity-90"
              />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {new Date(xray.createdAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex justify-between items-center">
                {xray.bodyPart}
                <Badge
                  variant="secondary"
                  className={
                    xray.status === "reviewed"
                      ? "bg-green-100 text-green-700"
                      : xray.status === "analyzed"
                        ? "bg-blue-100 text-blue-700"
                        : ""
                  }
                >
                  {statusTranslations[xray.status] || xray.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-md">
                <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] uppercase tracking-wider">
                  <BrainCircuit className="h-3.5 w-3.5" /> Phân tích AI
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {xray.aiAnalysis || "Đang chờ phân tích..."}
                </p>
              </div>
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-md relative group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-[11px] uppercase tracking-wider">
                    <Stethoscope className="h-3.5 w-3.5" /> Ghi chú của bác sĩ
                  </div>

                  {isDoctor && editingId !== xray._id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => startEditing(xray)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {editingId === xray._id ? (
                  <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                    <Textarea
                      value={notesContent}
                      onChange={(e) => setNotesContent(e.target.value)}
                      placeholder="Thêm quan sát lâm sàng, chẩn đoán hoặc khuyến nghị..."
                      className="min-h-20 text-xs bg-white dark:bg-slate-900"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={cancelEditing}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Hủy
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                        onClick={() => saveNotes(xray._id)}
                        disabled={updateNotesMutation.isPending}
                      >
                        {updateNotesMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5 mr-1" />
                        )}
                        Lưu
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    {xray.doctorNotes ? (
                      `"${xray.doctorNotes}"`
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 not-italic">
                        Chưa có ghi chú lâm sàng nào.
                      </span>
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default Radiology;
