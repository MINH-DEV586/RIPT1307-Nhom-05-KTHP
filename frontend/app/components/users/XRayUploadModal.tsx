import { useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomInput } from "@/components/global/CustomInput";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { createLabResult, deleteFile } from "@/lib/api";

const XRayUploadModal = ({ patientId }: { patientId: string }) => {
  const [imageUrl, setImageUrl] = useState("");
  const [open, setOpen] = useState(false);
  const form = useForm({ defaultValues: { bodyPart: "", notes: "" } });

  const mutation = useMutation({
    mutationFn: createLabResult,
    onSuccess: () => {
      setOpen(false);
      toast.success("Đã ghi nhận X-Ray thành công");
      form.reset();
      setImageUrl("");
    },
    onError: (error) => {
      toast.error(error.message || "Ghi nhận X-Ray thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      setImageUrl("");
      toast.success("Đã xóa tệp thành công!");
    },
    onError: (error) => {
      toast.error(error.message || "Xóa tệp thất bại");
    },
  });

  const handleSave = (formData: any) => {
    if (!imageUrl) return toast.error("Vui lòng tải ảnh lên trước");
    mutation.mutate({
      patientId,
      testType: "X-Ray",
      bodyPart: formData.bodyPart,
      imageUrl,
      aiAnalysis: "Đang xử lý...",
    });
  };
  const removeFile = () => {
    deleteMutation.mutate({
      file: imageUrl,
    });
  };
  return (
    <Dialog open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
      <DialogTrigger asChild>
        <Button variant="outline">Tải lên X-Ray</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg card">
        <DialogHeader>
          <DialogTitle>Tải lên X-Ray mới</DialogTitle>
        </DialogHeader>
        {!imageUrl ? (
          <UploadDropzone
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              setImageUrl(res[0].ufsUrl);
              toast.success("Tải ảnh lên thành công");
            }}
            headers={async () => {
              const session = await authClient.getSession();
              return {
                Authorization: `Bearer ${session.data?.session.token}`,
              };
            }}
            onUploadError={(error: Error) => {
              toast.error(`LỖI! ${error.message}`);
              console.error("Upload Error:", error);
            }}
            className="border-dashed border-slate-300 dark:border-slate-500 ut-label:text-blue-600"
          />
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Preview"
                className="h-full w-full object-contain"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                type="button"
                onClick={() => removeFile()}
                disabled={deleteMutation.isPending}
              >
                Xóa
              </Button>
            </div>

            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="space-y-3"
            >
              <CustomInput
                control={form.control}
                name="bodyPart"
                label="Bộ phận cơ thể"
                placeholder="Ví dụ: Đầu gối trái"
                disabled={mutation.isPending}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                Lưu vào hồ sơ bệnh nhân
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default XRayUploadModal;
