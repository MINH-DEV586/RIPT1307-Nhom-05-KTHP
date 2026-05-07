import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getLabRequestsList, updateLabRequestStatus } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Plus, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function LabRequestList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await getLabRequestsList(params);
      setRequests(data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateLabRequestStatus(id, newStatus);
      toast.success("Đã cập nhật trạng thái");
      fetchData();
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const filtered = requests.filter(
    (r) =>
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.testType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <FlaskConical className="w-8 h-8" />
            Yêu cầu xét nghiệm
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và theo dõi tiến độ xét nghiệm cận lâm sàng.
          </p>
        </div>
        <Button asChild className="shadow-lg shadow-primary/20">
          <Link to="/lab/requests/create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo yêu cầu mới
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 w-full max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm bệnh nhân, loại xét nghiệm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background/50 border-primary/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="processing">Đang thực hiện</SelectItem>
                <SelectItem value="completed">Đã hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="font-semibold">Mã yêu cầu</TableHead>
                <TableHead className="font-semibold">Bệnh nhân</TableHead>
                <TableHead className="font-semibold">Bác sĩ chỉ định</TableHead>
                <TableHead className="font-semibold">Loại xét nghiệm</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold">Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 italic text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Không tìm thấy yêu cầu nào.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r._id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{r._id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">{r.patientName}</TableCell>
                    <TableCell className="text-sm">{r.doctorName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5">{r.testType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={r.status} 
                        onValueChange={(val) => handleStatusUpdate(r._id, val)}
                      >
                        <SelectTrigger className="h-8 w-[140px] border-none bg-transparent p-0 focus:ring-0">
                          <Badge 
                            className={
                              r.status === "completed" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                              r.status === "processing" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                              r.status === "cancelled" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                              "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                            }
                          >
                            {r.status === "pending" ? "Chờ xử lý" :
                             r.status === "processing" ? "Đang thực hiện" :
                             r.status === "completed" ? "Đã hoàn thành" : "Đã hủy"}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Chờ xử lý</SelectItem>
                          <SelectItem value="processing">Đang thực hiện</SelectItem>
                          <SelectItem value="completed">Đã hoàn thành</SelectItem>
                          <SelectItem value="cancelled">Hủy yêu cầu</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-2">
                         {r.status !== "completed" && r.status !== "cancelled" && (
                           <Button size="sm" variant="default" asChild className="h-8 bg-blue-600 hover:bg-blue-700">
                             <Link to={`/lab/requests/${r._id}/enter-results`}>Nhập kết quả</Link>
                           </Button>
                         )}
                         <Button variant="ghost" size="sm" asChild className="h-8">
                            <Link to={`/dashboard`}>Bệnh án</Link>
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
