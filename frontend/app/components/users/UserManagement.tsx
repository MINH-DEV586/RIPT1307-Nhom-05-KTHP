import { authClient } from "@/lib/auth-client";
import type { Role, User, UserStatus } from "@/types";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActivityLog, getUsers } from "@/lib/api";
import { useNavigate } from "react-router";
import { Zap } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { STATUS_CONFIG } from "./statusBadge";
import { toast } from "sonner";
import GlobalSearch from "@/components/global/GlobalSearch";
import CustomPagination from "@/components/global/CustomPagination";
import CreateUserModal from "./CreateUserModal";
import { socket } from "@/lib/socket";
import { DetailsSheet } from "./DetailsSheet";
import StatsCards from "@/components/global/StatsCards";

interface UserManagementProps {
  role: Role;
  title: string;
  description: string;
}

const UserManagement = ({ role, title, description }: UserManagementProps) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const fetchQueryKey = ["users", role, page];
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { data: session } = authClient.useSession();

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsSheetOpen(true);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: fetchQueryKey,
    queryFn: () => getUsers({ role, page, limit: 10 }),
    placeholderData: (previousData) => previousData,
    subscribed: true,
  });

  const users = data?.res || [];
  const pagination = data?.pagination;

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleUpdate = () => refetch();

    socket.on("notify_user_updated", handleUpdate);
    socket.on("notify_user_created", handleUpdate);

    return () => {
      socket.off("notify_user_updated", handleUpdate);
      socket.off("notify_user_created", handleUpdate);
    };
  }, [refetch]);

  const activityMutation = useMutation({
    mutationFn: createActivityLog,
    onError: (error) => {
      console.log("Activity Log Error:", error);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader label={`Đang tải ${title}...`} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <h1 className="text-xl font-bold text-red-500">
          Tải dữ liệu thất bại. Vui lòng làm mới trang.
        </h1>
      </div>
    );
  }

  const filteredUsers = users?.filter((user) =>
    user?.name.toLowerCase().includes(search.toLowerCase()),
  );

  const banUser = async (banned: boolean, userId: string) => {
    try {
      setLoading(true);
      if (banned) {
        await authClient.admin.unbanUser({ userId });
        toast.success("Đã bỏ cấm người dùng thành công.");
        refetch();
        activityMutation.mutate({
          userId: session?.user.id!,
          action: "ban",
          details: `Đã bỏ cấm người dùng có ID: ${userId}`,
        });
        setLoading(false);
      } else {
        await authClient.admin.banUser({ userId });
        toast.success("Đã cấm người dùng thành công.");
        refetch();
        setLoading(false);
        activityMutation.mutate({
          userId: session?.user.id!,
          action: "ban",
          details: `Đã cấm người dùng có ID: ${userId}`,
        });
      }
    } catch (error) {
      setLoading(false);
      console.error("Error banning/unbanning user:", error);
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      const { error } = await authClient.admin.removeUser({ userId });
      if (error) {
        toast.error("Xóa người dùng thất bại.");
        setLoading(false);
      } else {
        toast.success("Đã xóa người dùng thành công.");
        refetch();
        setLoading(false);
        activityMutation.mutate({
          userId: session?.user.id!,
          action: "delete",
          details: `Đã xóa người dùng có ID: ${userId}`,
        });
      }
    } catch (error) {
      setLoading(false);
      console.error("Error deleting user:", error);
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  const genderTranslations: Record<string, string> = {
    male: "Nam",
    female: "Nữ",
    other: "Khác",
    Male: "Nam",
    Female: "Nữ",
    Other: "Khác",
  };

  return (
    <div className="space-y-6">
      <StatsCards data={users} />
      <DetailsSheet
        user={selectedUser}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
      <Card className="card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <GlobalSearch
              search={search}
              setSearch={setSearch}
              title={`Tìm kiếm ${title}`}
            />
            <CreateUserModal role={role} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-300 dark:border-zinc-700">
            <Table>
              <TableHeader>
                <TableRow className="">
                  <TableHead>Tên</TableHead>
                  <TableHead>Email</TableHead>
                  {role === "doctor" && <TableHead>Chuyên môn</TableHead>}
                  {role === "patient" && (
                    <>
                      <TableHead>Giới tính</TableHead>
                      <TableHead>Nhóm máu</TableHead>
                      <TableHead>Thành viên</TableHead>
                    </>
                  )}
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Xem</TableHead>

                  <TableHead className="text-right">Sửa | Xóa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center h-24 text-muted-foreground"
                    >
                      Không tìm thấy hồ sơ nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <button 
                            className="hover:text-indigo-600 hover:underline transition-colors text-left"
                            onClick={() => {
                              const id = typeof user._id === 'object' ? (user._id as any).toString() : user._id;
                              navigate(`/profile/${id}`);
                            }}
                          >
                            {user.name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>

                      {role === "doctor" && (
                        <TableCell>
                          <Badge variant="secondary">
                            {user.specialization || "Đa khoa"}
                          </Badge>
                        </TableCell>
                      )}
                      {role === "patient" && (
                        <>
                          <TableCell>{genderTranslations[user.gender!] || user.gender || "N/A"}</TableCell>
                          <TableCell>
                            {user.bloodgroup ? (
                              <Badge
                                variant="outline"
                                className="text-red-500 border-red-200 bg-red-50"
                              >
                                {user.bloodgroup}
                              </Badge>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            {user.membership === "pro" ? (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                                <Zap size={10} className="fill-amber-500" /> PRO
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500">Thường</Badge>
                            )}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        {(() => {
                          const config =
                            STATUS_CONFIG[user.status as UserStatus] ||
                            STATUS_CONFIG["active"];
                          const Icon = config.icon;

                          return (
                            <Badge
                              variant="outline"
                              className={`gap-1.5 ${config.color}`}
                            >
                              {Icon && <Icon size={12} />}
                              {config.label}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewUser(user)}
                          >
                            Xem
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="float-right">
                        <div className="flex justify-end gap-2">
                          <CreateUserModal
                            role={role}
                            user={user}
                            loading={loading}
                          />
                          {session?.user.role === "admin" && (
                            <>
                              <Button
                                onClick={() => banUser(user?.banned, user._id)}
                                variant="outline"
                                size="sm"
                                disabled={loading}
                              >
                                {user.banned ? "Bỏ cấm" : "Cấm"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteUser(user._id)}
                                disabled={loading}
                              >
                                Xóa
                              </Button>
                            </>
                          )}
                        </div>
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
    </div>
  );
};

export default UserManagement;
