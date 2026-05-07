import { useEffect, useState } from "react";
import { getAllLabResultsList } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Search, Activity, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ManageLabResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const data = await getAllLabResultsList();
      setResults(data);
    } catch (error) {
      toast.error("Không thể tải danh sách kết quả");
    } finally {
      setLoading(false);
    }
  };

  const filtered = results.filter(r => 
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.testType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Activity className="w-8 h-8" />
          Kết quả xét nghiệm
        </h1>
        <p className="text-muted-foreground mt-1">
          Xem và quản lý các kết quả xét nghiệm chỉ số và hình ảnh.
        </p>
      </div>

      <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm bệnh nhân, loại xét nghiệm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background/50 border-primary/20"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="font-semibold">Bệnh nhân</TableHead>
                <TableHead className="font-semibold">Loại xét nghiệm</TableHead>
                <TableHead className="font-semibold">Chỉ số đo được</TableHead>
                <TableHead className="font-semibold">Ngày thực hiện</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 italic text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Chưa có kết quả xét nghiệm nào.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r._id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                    <TableCell className="font-medium">{r.patientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.testType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {r.indicators && r.indicators.length > 0 ? (
                          r.indicators.map((ind: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px] py-0">
                              {ind.name}: {ind.value} {ind.unit}
                            </Badge>
                          ))
                        ) : r.imageUrl ? (
                          <span className="text-xs italic text-blue-500 underline cursor-pointer">Xem hình ảnh</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Không có dữ liệu số</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        Đã có kết quả
                      </Badge>
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
