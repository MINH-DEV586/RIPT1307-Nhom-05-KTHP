import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllInvoices } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Receipt, CheckCircle2, DollarSign, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import CustomPagination from "@/components/global/CustomPagination";
import Loader from "@/components/global/Loader";
import GlobalSearch from "@/components/global/GlobalSearch";

export function meta() {
  return [{ title: "Lịch sử tài chính | MedFlow AI" }];
}

const FinancialHistory = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["all-invoices", page],
    queryFn: () => getAllInvoices({ page, limit: 10 }),
    placeholderData: (previousData) => previousData,
  });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader label="Đang tải hồ sơ tài chính..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-red-500 text-sm font-medium">
        Lỗi khi tải lịch sử tài chính.
      </div>
    );
  }

  const invoices = data?.res || [];
  const pagination = data?.pagination;

  const filteredInvoices = invoices.filter((inv) =>
    (inv.user?.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalRevenue = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);

  const paidCount = invoices.filter((i: any) => i.status === "paid").length;
  const pendingCount = invoices.filter(
    (i: any) => i.status === "pending_payment",
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1">
            <CheckCircle2 size={12} /> Đã thanh toán
          </Badge>
        );
      case "pending_payment":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 gap-1">
            <Clock size={12} /> Chờ thanh toán
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Receipt size={12} /> Bản nháp
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Sổ cái doanh thu
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Theo dõi chi tiết tất cả các giao dịch tài chính của bệnh viện.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg shrink-0">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">
                  Doanh thu thực thu
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white truncate">
                  {totalRevenue.toLocaleString()} VNĐ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Thanh toán thành công
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {paidCount} hóa đơn
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Đang chờ thanh toán
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {pendingCount} hóa đơn
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Table */}
      <Card className="card shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b">
          <div>
            <CardTitle className="text-base">Danh sách hóa đơn</CardTitle>
            <CardDescription className="mt-0.5">
              Tất cả các giao dịch tài chính trong hệ thống.
            </CardDescription>
          </div>
          <GlobalSearch
            search={search}
            setSearch={setSearch}
            title="bệnh nhân"
          />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 font-bold">Bệnh nhân</TableHead>
                <TableHead className="font-bold text-center">Số tiền</TableHead>
                <TableHead className="font-bold text-center">Trạng thái</TableHead>
                <TableHead className="font-bold text-center">Ngày</TableHead>
                <TableHead className="text-right pr-6 font-bold">Tham chiếu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-40 text-center text-slate-400 italic"
                  >
                    Không tìm thấy hóa đơn nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => (
                  <TableRow
                    key={inv._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-100 shrink-0">
                          <AvatarImage src={inv.user?.image || ""} />
                          <AvatarFallback className="font-bold text-xs bg-blue-50 text-blue-600">
                            {inv.user?.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {inv.user?.name || "—"}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {inv.user?.email || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-black text-slate-900 dark:text-white">
                      {inv.totalAmount.toLocaleString()} VNĐ
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(inv.status)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-slate-500">
                      {inv.createdAt
                        ? format(new Date(inv.createdAt), "dd/MM/yyyy", {
                            locale: vi,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {inv.polarCheckoutId ? (
                        <span className="text-xs font-mono text-slate-400">
                          {inv.polarCheckoutId.slice(0, 12)}...
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 italic">
                          Chưa xử lý
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <CustomPagination
            loading={isLoading}
            totalPages={pagination?.totalPages || 0}
            currentPage={pagination?.currentPage || 0}
            setPage={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialHistory;
