import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import { confirmVNPayPayment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  QrCode,
  Clock,
  Loader2,
  ShieldCheck,
  Smartphone,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";

interface VNPayQRModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  txnRef: string;
  amount: number;
  patientId: string;
}

const EXPIRE_SECONDS = 10 * 60; // 10 phút

export default function VNPayQRModal({
  open,
  onClose,
  invoiceId,
  txnRef,
  amount,
  patientId,
}: VNPayQRModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"pending" | "confirming" | "success">("pending");
  const [timeLeft, setTimeLeft] = useState(EXPIRE_SECONDS);
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Nội dung QR — định dạng giả lập VNPay
  const qrContent = [
    "VNPAYQR",
    `TxnRef:${txnRef}`,
    `Amount:${amount}`,
    `OrderInfo:Thanh toan hoa don benh vien`,
    `InvoiceId:${invoiceId}`,
  ].join("|");

  // URL tạo QR dùng api.qrserver.com (không cần cài thêm package)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrContent)}&ecc=M&margin=8&color=0-0-0&bgcolor=255-255-255`;

  // ── Reset state mỗi khi mở modal ─────────────────────────────
  useEffect(() => {
    if (!open) return;
    setTimeLeft(EXPIRE_SECONDS);
    setStatus("pending");
    setImgError(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, invoiceId]);

  // ── Lắng nghe socket event payment_confirmed ─────────────────
  useEffect(() => {
    if (!open) return;
    if (!socket.connected) socket.connect();

    const handler = (data: { invoiceId: string }) => {
      if (data.invoiceId === invoiceId) handleSuccess();
    };

    socket.on("payment_confirmed", handler);
    return () => { socket.off("payment_confirmed", handler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceId]);

  // ── Thành công ───────────────────────────────────────────────
  const handleSuccess = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("success");
    toast.success("Thanh toán thành công!", {
      description: `Giao dịch #${txnRef.slice(0, 8)} đã được xác nhận.`,
    });
    queryClient.invalidateQueries({ queryKey: ["active-invoice", patientId] });
    queryClient.invalidateQueries({ queryKey: ["billing-history", patientId] });
    setTimeout(() => {
      onClose();
      navigate("/patient/invoices");
    }, 2500);
  };

  // ── Nút xác nhận thủ công ────────────────────────────────────
  const handleManualConfirm = async () => {
    if (status !== "pending") return;
    setStatus("confirming");
    try {
      await confirmVNPayPayment(invoiceId, txnRef);
      handleSuccess();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xác nhận thanh toán");
      setStatus("pending");
    }
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const isExpired = timeLeft === 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && status !== "confirming") onClose(); }}>
      <DialogContent className="max-w-[360px] w-full p-0 overflow-hidden rounded-2xl border-0 shadow-2xl gap-0">

        {/* ── Header màu VNPay ── */}
        <div className="bg-gradient-to-br from-[#0060a9] to-[#003d7a] px-6 pt-5 pb-4 text-white">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <DialogTitle className="text-white text-base font-bold leading-tight">
                Thanh toán VNPay QR
              </DialogTitle>
            </div>
            <DialogDescription className="text-blue-200 text-xs pl-0.5">
              Quét mã bằng app ngân hàng / ví điện tử
            </DialogDescription>
          </DialogHeader>

          {/* Số tiền */}
          <div className="mt-3 bg-white/15 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-blue-200 text-xs font-medium">Số tiền thanh toán</span>
            <span className="text-white font-black tabular-nums text-lg">
              {amount.toLocaleString("vi-VN")}
              <span className="text-blue-300 text-xs font-semibold ml-1">VNĐ</span>
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="bg-white dark:bg-zinc-900 px-5 py-4 space-y-4">
          {status === "success" ? (
            /* Màn hình thành công */
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 animate-bounce" />
              </div>
              <div>
                <p className="text-base font-bold text-emerald-600">Thanh toán thành công!</p>
                <p className="text-xs text-muted-foreground mt-1">Đang chuyển về trang hóa đơn...</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-mono text-xs px-3">
                #{txnRef.slice(0, 12)}
              </Badge>
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div className="flex flex-col items-center gap-2">
                <div className={`relative border-2 rounded-xl overflow-hidden transition-opacity ${isExpired ? "opacity-30" : "border-[#0060a9]/25"}`}>
                  {!imgError ? (
                    <img
                      key={qrImageUrl}
                      src={qrImageUrl}
                      alt="VNPay QR Code"
                      width={240}
                      height={240}
                      className="block"
                      draggable={false}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    /* Fallback khi không load được ảnh từ mạng */
                    <div className="w-[240px] h-[240px] flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-zinc-800">
                      <ImageOff className="w-10 h-10 text-muted-foreground/50" />
                      <div className="text-center px-4">
                        <p className="text-xs font-semibold text-muted-foreground">Không tải được QR</p>
                        <p className="text-[10px] text-muted-foreground mt-1 break-all font-mono">{txnRef}</p>
                      </div>
                    </div>
                  )}

                  {/* Logo VNPay nhỏ giữa QR */}
                  {!imgError && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 bg-white rounded-md shadow border border-gray-100 flex items-center justify-center">
                        <span className="text-[7px] font-black text-[#0060a9] leading-none text-center">VN<br/>PAY</span>
                      </div>
                    </div>
                  )}

                  {/* Overlay hết hạn */}
                  {isExpired && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 flex items-center justify-center">
                      <p className="text-xs font-bold text-red-500">QR đã hết hạn</p>
                    </div>
                  )}
                </div>

                {/* Mã giao dịch */}
                <p className="text-[11px] text-muted-foreground font-mono">
                  Mã GD: <span className="font-bold text-foreground">{txnRef}</span>
                </p>
              </div>

              {/* Countdown */}
              {!isExpired && (
                <div className="flex items-center justify-center gap-1.5 text-xs">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span className="text-muted-foreground">Hết hạn sau</span>
                  <span className={`font-mono font-bold ${timeLeft < 60 ? "text-red-500" : "text-amber-600"}`}>
                    {minutes}:{seconds}
                  </span>
                </div>
              )}

              {/* Hướng dẫn */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 space-y-2">
                {[
                  { icon: Smartphone, text: "Mở app ngân hàng hoặc ví điện tử" },
                  { icon: QrCode,     text: 'Chọn "Quét QR" / "Thanh toán QR"' },
                  { icon: ShieldCheck,text: "Xác nhận thanh toán trên app" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/40 rounded flex items-center justify-center shrink-0">
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <span>{i + 1}. {text}</span>
                  </div>
                ))}
              </div>

              {/* Nút xác nhận */}
              <Button
                id="vnpay-confirm-btn"
                className="w-full h-11 font-bold bg-[#0060a9] hover:bg-[#003d7a] text-white gap-2 rounded-xl shadow-md shadow-blue-500/20"
                onClick={handleManualConfirm}
                disabled={status === "confirming" || isExpired}
              >
                {status === "confirming" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Đang xác nhận...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" />Xác nhận đã thanh toán</>
                )}
              </Button>

              <button
                id="vnpay-cancel-btn"
                onClick={onClose}
                disabled={status === "confirming"}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
              >
                Hủy bỏ
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
