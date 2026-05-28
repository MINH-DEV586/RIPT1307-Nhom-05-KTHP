import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyActiveInvoice, getBillingHistory, createCheckoutSession } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, History, Receipt, Wallet, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Loader from "@/components/global/Loader";
import { toast } from "sonner";

export default function PatientInvoices() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const { data: activeInvoices, isLoading: loadingActive } = useQuery<any[]>({
    queryKey: ["active-invoice", userId],
    queryFn: () => getMyActiveInvoice(userId!),
    enabled: !!userId,
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery({
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
    }
  });

  if (loadingActive || loadingHistory) return <div className="h-[60vh] flex items-center justify-center"><Loader label="Đang tải thông tin thanh toán..." /></div>;

  const totalAmountPending = activeInvoices && Array.isArray(activeInvoices)
    ? activeInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Hóa đơn & Thanh toán</h1>
        <p className="text-muted-foreground text-lg">
          Theo dõi các khoản phí khám bệnh và thực hiện thanh toán trực tuyến.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Card */}
        <Card className="md:col-span-1 bg-indigo-600 text-white border-none shadow-xl shadow-indigo-500/20">
          <CardHeader>
            <CardTitle className="text-white/80 text-sm font-bold uppercase tracking-wider">Tổng phí cần trả</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-4xl font-black">{totalAmountPending.toLocaleString()} <span className="text-xl">VNĐ</span></h2>
            <div className="mt-6 p-4 bg-white/10 rounded-2xl flex items-center gap-3">
              <Wallet className="w-5 h-5 text-indigo-200" />
              <p className="text-xs font-medium text-indigo-100">Bạn có {activeInvoices?.length || 0} hóa đơn đang chờ thanh toán.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              disabled={!activeInvoices || activeInvoices.length === 0} 
              onClick={() => activeInvoices?.[0] && paymentMutation.mutate(activeInvoices[0]._id)}
              className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black py-6 rounded-xl"
            >
              {activeInvoices && activeInvoices.length > 1 ? "Thanh toán hóa đơn đầu tiên" : "Thanh toán ngay"}
            </Button>
          </CardFooter>
        </Card>

        {/* Detailed Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="pending" className="font-bold rounded-lg">Đang chờ</TabsTrigger>
              <TabsTrigger value="history" className="font-bold rounded-lg">Lịch sử</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="pt-6">
              {activeInvoices && activeInvoices.length > 0 ? (
                <div className="space-y-6">
                  {activeInvoices.map((inv: any) => (
                    <Card key={inv._id} className="card shadow-xl border-none bg-card/40 backdrop-blur-md">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-indigo-500" />
                            <CardTitle className="text-lg">Chi tiết hóa đơn</CardTitle>
                          </div>
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Chưa thanh toán</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {inv.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center py-3 border-b last:border-0 border-border/50">
                            <div>
                              <p className="font-bold text-sm">{item.description}</p>
                              <p className="text-xs text-muted-foreground">Số lượng: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-sm">{item.totalPrice.toLocaleString()} VNĐ</p>
                          </div>
                        ))}
                      </CardContent>
                      <CardFooter className="bg-muted/30 pt-4 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">Ngày tạo: {format(new Date(inv.createdAt), "dd/MM/yyyy HH:mm")}</p>
                        <div className="flex items-center gap-3">
                          <p className="font-black text-lg text-primary">{inv.totalAmount.toLocaleString()} VNĐ</p>
                          <Button 
                            disabled={paymentMutation.isPending}
                            onClick={() => paymentMutation.mutate(inv._id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                          >
                            <CreditCard className="w-4 h-4 mr-2" /> Thanh toán
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/20 rounded-3xl border border-dashed">
                  <div className="p-4 bg-muted rounded-full opacity-40">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-muted-foreground">Bạn không có hóa đơn chờ</h3>
                  <p className="text-muted-foreground">Tất cả các khoản phí đã được tất toán.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="pt-6">
              <div className="space-y-4">
                {history.length > 0 ? (
                  history.map((inv: any) => (
                    <div key={inv._id} className="flex items-center justify-between p-4 bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Thanh toán hoàn tất</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(inv.updatedAt), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm">{inv.totalAmount.toLocaleString()} VNĐ</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">VNPay / Polar</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 opacity-50">Chưa có lịch sử giao dịch.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
