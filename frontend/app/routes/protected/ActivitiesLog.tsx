import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getActivityLogs } from "@/lib/api";
import CustomPagination from "@/components/global/CustomPagination";
import Loader from "@/components/global/Loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import GlobalSearch from "@/components/global/GlobalSearch";
import type { Role } from "@/types";

export function meta() {
  return [{ title: "Hoạt động hệ thống" }];
}

const roleTranslations: Record<Role, string> = {
  admin: "Quản trị viên",
  doctor: "Bác sĩ",
  nurse: "Điều dưỡng",
  pharmacist: "Dược sĩ",
  lab_tech: "Kỹ thuật viên",
  patient: "Bệnh nhân",
  superadmin: "Siêu quản trị",
};

const ActivitiesLog = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["activities-log", page],
    queryFn: () => getActivityLogs({ page, limit }),
    placeholderData: (previousData) => previousData,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader label="Đang tải nhật ký..." />
      </div>
    );

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive font-bold">
        Lỗi khi tải nhật ký hoạt động.
      </div>
    );
  }

  const logs = data?.res || [];
  const pagination = data?.pagination;

  const filteredLogs = logs?.filter((log) =>
    log?.action.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card className="card shadow-sm border-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-bold text-xl">Hoạt động hệ thống</CardTitle>
          <CardDescription>
            Lịch sử tất cả các hành động được thực hiện bởi nhân viên bệnh viện.
          </CardDescription>
        </div>
        <GlobalSearch
          search={search}
          setSearch={setSearch}
          title="Tìm kiếm hành động..."
        />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="">
                <TableHead>Người dùng</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Chi tiết</TableHead>
                <TableHead>Ngày & Giờ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Không tìm thấy nhật ký hoạt động.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.user?.image || ""} />
                          <AvatarFallback>
                            {log.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {log.user?.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {log.user?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="capitalize text-[10px]"
                      >
                        {roleTranslations[log.user?.role as Role] || log.user?.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500 truncate max-w-50 block">
                        {log.details || "---"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {format(
                        new Date(log.createdAt),
                        "dd/MM/yyyy - hh:mm a",
                        { locale: vi }
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivitiesLog;
