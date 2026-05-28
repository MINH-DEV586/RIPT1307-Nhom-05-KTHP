import { useQuery, useMutation } from "@tanstack/react-query";
import { getMyActiveInvoice, getBillingHistory, createCheckoutSession } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Receipt, Wallet, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import { toast } from "sonner";

export function meta() {
  return [{ title: "Hóa đơn & Thanh toán | MedFlow AI" }];
}

export default function PatientInvoices() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const { data: activeInvoices, isLoading: loadingActive } = useQuery<any[]>({
    queryKey: ["active-invoice", userId],
    queryFn: () => getMyActiveInvoice(userId!),
    enabled: !!userId,
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery<any[]>({
    queryKey: ["billing-history", userId],
    queryFn: () => getBillingHistory(userId!),
    enabled: !!userId,
  });

  const paymentMutation = useMutation({
    mutationFn: (id: string) => createCheckoutSession(id),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: () => {
      toast.error("Lỗi khi xử lý thanh toán.");
    },
  });

  if (loadingActive || loadingHistory) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader label="Đang tải thông tin thanh toán..." />
      </div>
    );
  }

  const pendingInvoices = Array.isArray(activeInvoices) ? activeInvoices : [];
  const paidInvoices = Array.isArray(history) ? history : [];
  const totalAmountPending = pendingInvoices.reduce(
    (sum, inv) => sum + (inv.totalAmount || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          Hóa đơn &amp; Thanh toán
        </h1>
        <p className="text-muted-foreground mt-1">
          Theo dõi các khoản phí khám bệnh và thực hiện thanh toán trực tuyến.
        </p>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

        {/* ── Left: Summary Card ── */}
        <div className="md:col-span-1 space-y-3">
          <Card className="border-0 bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 overflow-hidden">
            <CardHeader className="pb-0 pt-5 px-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-200">
                Tổng phí cần trả
              </p>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-3">
              <p className="text-5xl font-black tracking-tight leading-none">
                {totalAmountPending.toLocaleString()}
              </p>
              <p className="text-indigo-200 font-semibold mt-1">VNĐ</p>

              <div className="mt-5 flex items-center gap-2 bg-white/10 rounded-md px-3 py-2.5">
                {pendingInvoices.length > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-indigo-200 shrink-0" />
                    <p className="text-xs text-indigo-100 font-medium">
                      {pendingInvoices.length} hóa đơn đang chờ thanh toán
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <p className="text-xs text-indigo-100 font-medium">
                      Tất cả hóa đơn đã được tất toán
                    </p>
                  </>
                )}
              </div>

              <Button
                disabled={pendingInvoices.length === 0 || paymentMutation.isPending}
                onClick={() =>
                  pendingInvoices[0] && paymentMutation.mutate(pendingInvoices[0]._id)
                }
                className="mt-4 w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold h-10 gap-2 shadow-none"
              >
                <CreditCard className="w-4 h-4" />
                {pendingInvoices.length > 1 ? "Thanh toán hóa đơn đầu tiên" : "Thanh toán ngay"}
              </Button>
            </CardContent>
          </Card>

          {/* Mini stats */}
          <Card className="card shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Chờ thanh toán
                </span>
                <span className="font-bold">{pendingInvoices.length} hóa đơn</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Đã thanh toán
                </span>
                <span className="font-bold">{paidInvoices.length} giao dịch</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                  Tổng đã thanh toán
                </span>
                <span className="font-bold text-emerald-600">
                  {paidInvoices
                    .reduce((s: number, i: any) => s + (i.totalAmount || 0), 0)
                    .toLocaleString()}{" "}
                  VNĐ
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Tabs ── */}
        <div className="md:col-span-2">
          <Tabs defaultValue={pendingInvoices.length > 0 ? "pending" : "history"}>
            <TabsList className="mb-4 h-14 bg-transparent border-0 p-0 gap-3">
              <TabsTrigger
                value="pending"
                className="gap-2 font-semibold px-6 text-sm h-[44px] rounded-lg
                  border bg-white text-muted-foreground border-border shadow-sm
                  hover:bg-slate-50 hover:text-foreground
                  data-[state=active]:bg-indigo-600 data-[state=active]:text-white
                  data-[state=active]:border-indigo-600 data-[state=active]:shadow-md
                  focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
                  transition-all duration-200"
              >
                <Clock className="w-4 h-4" />
                Đang chờ
                {pendingInvoices.length > 0 && (
                  <Badge className="bg-amber-500 text-white border-0 hover:bg-amber-500 px-1.5 py-0 text-[11px] font-bold ml-1 data-[state=active]:bg-white/25 data-[state=active]:text-white">
                    {pendingInvoices.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="gap-2 font-semibold px-6 text-sm h-[44px] rounded-lg
                  border bg-white text-muted-foreground border-border shadow-sm
                  hover:bg-slate-50 hover:text-foreground
                  data-[state=active]:bg-indigo-600 data-[state=active]:text-white
                  data-[state=active]:border-indigo-600 data-[state=active]:shadow-md
                  focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
                  transition-all duration-200"
              >
                <CheckCircle2 className="w-4 h-4" />
                Lịch sử
                {paidInvoices.length > 0 && (
                  <Badge className="bg-emerald-500 text-white border-0 hover:bg-emerald-500 px-1.5 py-0 text-[11px] font-bold ml-1 data-[state=active]:bg-white/25 data-[state=active]:text-white">
                    {paidInvoices.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Pending tab */}
            <TabsContent value="pending" className="mt-0 space-y-3">
              {pendingInvoices.length > 0 ? (
                pendingInvoices.map((inv: any) => (
                  <Card key={inv._id} className="card shadow-sm overflow-hidden">
                    {/* Header row */}
                    <div className="flex items-center justify-between px-5 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                          Chi tiết hóa đơn
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-700 dark:text-amber-500">
                          {format(new Date(inv.createdAt), "dd/MM/yyyy", { locale: vi })}
                        </span>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100 gap-1 text-[11px]">
                          <Clock size={10} />
                          Chưa thanh toán
                        </Badge>
                      </div>
                    </div>

                    {/* Line items */}
                    <CardContent className="p-0">
                      {inv.items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center px-5 py-3.5 border-b border-border/50 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Số lượng: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-bold tabular-nums shrink-0 ml-4">
                            {item.totalPrice.toLocaleString()} VNĐ
                          </p>
                        </div>
                      ))}
                    </CardContent>

                    {/* Total + pay */}
                    <div className="flex items-center justify-between px-5 py-4 bg-muted/30 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Tổng cộng</p>
                        <p className="text-xl font-black tabular-nums">
                          {inv.totalAmount.toLocaleString()}{" "}
                          <span className="text-sm font-semibold text-muted-foreground">VNĐ</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={paymentMutation.isPending}
                        onClick={() => paymentMutation.mutate(inv._id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 px-4"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Thanh toán
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="card shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Không có hóa đơn chờ</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tất cả các khoản phí đã được tất toán.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History tab */}
            <TabsContent value="history" className="mt-0">
              <Card className="card shadow-sm overflow-hidden">
                {paidInvoices.length === 0 ? (
                  <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                      <Wallet className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Chưa có lịch sử giao dịch
                    </p>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="px-5 py-3 border-b">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">
                        {paidInvoices.length} giao dịch đã hoàn tất
                      </CardTitle>
                    </CardHeader>
                    <div className="divide-y divide-border">
                      {paidInvoices.map((inv: any) => (
                        <div
                          key={inv._id}
                          className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50 transition-colors">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Thanh toán hoàn tất</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(inv.updatedAt), "dd/MM/yyyy · HH:mm", { locale: vi })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black tabular-nums">
                              {inv.totalAmount.toLocaleString()} VNĐ
                            </p>
                            {inv.polarCheckoutId ? (
                              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                                #{inv.polarCheckoutId.slice(-8).toUpperCase()}
                              </p>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] mt-1 px-1.5">
                                Đã thanh toán
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
