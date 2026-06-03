import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { getAllPrescriptionsList } from "@/lib/api";
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
import { FileText, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") || undefined;

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllPrescriptionsList(patientId ? { patientId } : undefined);
      setPrescriptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = prescriptions.filter(
    (p) =>
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      p._id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Đơn thuốc
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và theo dõi các đơn thuốc đã kê.
          </p>
        </div>
        <Button asChild className="shadow-lg shadow-primary/20">
          <Link to="/pharmacy/prescriptions/create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Kê đơn mới
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo bệnh nhân, chẩn đoán..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background/50 border-primary/20"
            />
          </div>
          {patientId && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Đang lọc theo bệnh nhân: {prescriptions[0]?.patientName || `#${patientId}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-blue-200/50 rounded-lg text-blue-600"
                onClick={() => {
                  searchParams.delete("patientId");
                  setSearchParams(searchParams);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="font-semibold">Mã đơn</TableHead>
                <TableHead className="font-semibold">Bệnh nhân</TableHead>
                <TableHead className="font-semibold">Bác sĩ</TableHead>
                <TableHead className="font-semibold">Chẩn đoán</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold">Ngày kê</TableHead>
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
                    Không tìm thấy đơn thuốc nào.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p._id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{p._id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">{p.patientName}</TableCell>
                    <TableCell className="text-sm">{p.doctorName}</TableCell>
                    <TableCell>
                      <span className="text-sm truncate max-w-[150px] inline-block">{p.diagnosis}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={p.status === "pending" ? "default" : "secondary"}
                        className={p.status === "dispensed" ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
                      >
                        {p.status === "pending" ? "Chưa phát" : "Đã phát"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost" className="hover:bg-primary/10">
                        <Link to={`/pharmacy/dispense/${p._id}`}>Chi tiết</Link>
                      </Button>
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
