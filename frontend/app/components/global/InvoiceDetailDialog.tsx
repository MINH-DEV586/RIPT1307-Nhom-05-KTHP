import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, CheckCircle2, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface InvoiceDetailDialogProps {
  invoice: any;
  open: boolean;
  onClose: () => void;
}

export default function InvoiceDetailDialog({
  invoice,
  open,
  onClose,
}: InvoiceDetailDialogProps) {
  if (!invoice) return null;

  const isPaid = invoice.status === "paid";
  const dateField = isPaid ? invoice.updatedAt : invoice.createdAt;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto p-0 gap-0">
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950/30 dark:to-blue-950/20 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Receipt className="w-5 h-5" />
              Chi tiết hóa đơn
            </DialogTitle>
          </DialogHeader>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="gap-1 text-xs">
              <Calendar className="w-3 h-3" />
              {dateField
                ? format(new Date(dateField), "dd/MM/yyyy · HH:mm", { locale: vi })
                : "Không rõ"}
            </Badge>
            <Badge
              className={
                isPaid
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 text-xs"
                  : "bg-amber-100 text-amber-700 border-amber-300 gap-1 text-xs"
              }
            >
              {isPaid ? (
                <><CheckCircle2 className="w-3 h-3" />Đã thanh toán</>
              ) : (
                <><Clock className="w-3 h-3" />Chờ thanh toán</>
              )}
            </Badge>
            <Badge variant="secondary" className="font-mono text-[10px]">
              #{invoice._id?.slice(-8)?.toUpperCase()}
            </Badge>
            {invoice.vnpayTxnRef && (
              <Badge variant="outline" className="font-mono text-[10px] text-blue-600 border-blue-200">
                VNPay #{invoice.vnpayTxnRef.slice(0, 8)}
              </Badge>
            )}
          </div>
        </div>

        {/* ── Items Table ── */}
        <div className="px-6 py-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Chi tiết các khoản phí
          </p>

          {!invoice.items || invoice.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 italic">
              Không có khoản phí nào.
            </p>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b">
                <span>Mô tả</span>
                <span className="text-center">SL</span>
                <span className="text-right">Thành tiền</span>
              </div>

              {/* Items */}
              <div className="divide-y divide-border/60">
                {invoice.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{item.description}</p>
                      {item.isEstimated && (
                        <span className="text-[10px] text-amber-600 font-medium">Tạm tính</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground text-center shrink-0 w-8">
                      {item.quantity}
                    </span>
                    <span className="text-sm font-bold tabular-nums shrink-0 text-right">
                      {item.totalPrice.toLocaleString()}
                      <span className="text-[10px] text-muted-foreground font-normal ml-0.5">đ</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Total ── */}
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tổng cộng</p>
              {invoice.isEstimatedInvoice && (
                <p className="text-[10px] text-amber-600 mt-0.5">* Bao gồm các khoản tạm tính</p>
              )}
            </div>
            <div className="text-right">
              <p className={`text-2xl font-black tabular-nums ${isPaid ? "text-emerald-600" : "text-blue-600"}`}>
                {(invoice.totalAmount || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground font-semibold">VNĐ</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
