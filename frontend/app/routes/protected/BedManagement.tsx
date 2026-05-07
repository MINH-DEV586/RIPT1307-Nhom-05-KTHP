import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BedDouble,
  Activity,
  CheckCircle2,
  Wrench,
  Users,
  LayoutGrid,
  List,
  Stethoscope,
} from "lucide-react";
import Loader from "@/components/global/Loader";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { User } from "@/types";

export function meta() {
  return [{ title: "Quản lý giường bệnh | MedFlow AI" }];
}

const DEPARTMENTS = [
  { id: "all", label: "Tất cả khoa" },
  { id: "Nội tổng quát", label: "Nội tổng quát" },
  { id: "Tim mạch", label: "Tim mạch" },
  { id: "Thần kinh", label: "Thần kinh" },
  { id: "Nhi khoa", label: "Nhi khoa" },
  { id: "Chấn thương chỉnh hình", label: "CTCH" },
];

// Generate mock rooms (16 per department)
function generateRooms(patients: User[], dept: string) {
  const admitted = patients.filter(
    (p) => p.status === "admitted" && (dept === "all" || true),
  );
  const rooms = [];
  for (let floor = 3; floor <= 5; floor++) {
    for (let room = 1; room <= 4; room++) {
      const roomNo = `${floor}0${room}`;
      const bedCount = 4;
      const occupiedBeds = admitted.splice(0, Math.floor(Math.random() * 3));
      const maintenanceBeds = Math.random() < 0.08 ? 1 : 0;
      const availableBeds = bedCount - occupiedBeds.length - maintenanceBeds;
      rooms.push({
        id: roomNo,
        number: roomNo,
        floor,
        department: dept === "all" ? DEPARTMENTS[1 + (room % 5)].id : dept,
        bedCount,
        occupiedBeds,
        maintenanceBeds,
        availableBeds: Math.max(0, availableBeds),
      });
    }
  }
  return rooms;
}

type BedStatus = "available" | "occupied" | "maintenance";

function BedIcon({ status }: { status: BedStatus }) {
  return (
    <div
      className={`
        w-8 h-5 rounded-sm border-2 flex items-center justify-center transition-all
        ${status === "available" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" : ""}
        ${status === "occupied" ? "border-indigo-400 bg-indigo-100 dark:bg-indigo-950/60" : ""}
        ${status === "maintenance" ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40" : ""}
      `}
    >
      <BedDouble
        className={`w-3 h-3
          ${status === "available" ? "text-emerald-500" : ""}
          ${status === "occupied" ? "text-indigo-500" : ""}
          ${status === "maintenance" ? "text-amber-500" : ""}
        `}
      />
    </div>
  );
}

export default function BedManagementPage() {
  const [selectedDept, setSelectedDept] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, isLoading } = useQuery({
    queryKey: ["patients", "admitted"],
    queryFn: () => getUsers({ role: "patient", limit: 100 }),
  });

  const patients = data?.res || [];
  const admittedPatients = patients.filter((p) => p.status === "admitted");
  const rooms = generateRooms([...admittedPatients], selectedDept);

  const totalBeds = rooms.reduce((s, r) => s + r.bedCount, 0);
  const occupiedBeds = rooms.reduce((s, r) => s + r.occupiedBeds.length, 0);
  const availableBeds = rooms.reduce((s, r) => s + r.availableBeds, 0);
  const maintenanceBeds = rooms.reduce((s, r) => s + r.maintenanceBeds, 0);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const pieData = [
    { name: "Đang dùng", value: occupiedBeds, color: "#6366f1" },
    { name: "Còn trống", value: availableBeds, color: "#10b981" },
    { name: "Bảo trì", value: maintenanceBeds, color: "#f59e0b" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader label="Đang tải thông tin giường bệnh..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Quản lý giường bệnh</h1>
          <p className="text-muted-foreground">Theo dõi tình trạng giường bệnh theo thời gian thực.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="gap-2"
          >
            <LayoutGrid className="w-4 h-4" /> Lưới
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="gap-2"
          >
            <List className="w-4 h-4" /> Danh sách
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng giường", value: totalBeds, icon: BedDouble, color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
          { label: "Đang sử dụng", value: occupiedBeds, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
          { label: "Còn trống", value: availableBeds, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Tỷ lệ lấp đầy", value: `${occupancyRate}%`, icon: Users, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
        ].map((s) => (
          <Card key={s.label} className="card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Chart + Legend */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Phân bổ giường</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any) => [`${v} giường`, ""]}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Chú thích</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { status: "available" as BedStatus, label: "Còn trống" },
                { status: "occupied" as BedStatus, label: "Đang dùng" },
                { status: "maintenance" as BedStatus, label: "Bảo trì" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <BedIcon status={item.status} />
                  <span>{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Rooms */}
        <div className="lg:col-span-3">
          {/* Department Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {DEPARTMENTS.map((d) => (
              <Button
                key={d.id}
                size="sm"
                variant={selectedDept === d.id ? "default" : "outline"}
                onClick={() => setSelectedDept(d.id)}
                className={selectedDept === d.id ? "bg-indigo-600 hover:bg-indigo-700" : ""}
              >
                {d.label}
              </Button>
            ))}
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const occupancyPct = Math.round((room.occupiedBeds.length / room.bedCount) * 100);
                const isHighOccupancy = occupancyPct >= 75;
                return (
                  <Card
                    key={room.id}
                    className={`card shadow-sm hover:shadow-md transition-all cursor-default ${isHighOccupancy ? "ring-1 ring-amber-400/50" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-black text-lg">Phòng {room.number}</span>
                          <p className="text-xs text-muted-foreground">Tầng {room.floor} · {room.department}</p>
                        </div>
                        <Badge
                          className={
                            occupancyPct >= 75
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : occupancyPct === 0
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-indigo-100 text-indigo-700 border-indigo-200"
                          }
                        >
                          {occupancyPct}%
                        </Badge>
                      </div>

                      {/* Bed visualization */}
                      <div className="flex gap-1.5 mb-3 flex-wrap">
                        {Array.from({ length: room.occupiedBeds.length }).map((_, i) => (
                          <BedIcon key={`occ-${i}`} status="occupied" />
                        ))}
                        {Array.from({ length: room.maintenanceBeds }).map((_, i) => (
                          <BedIcon key={`maint-${i}`} status="maintenance" />
                        ))}
                        {Array.from({ length: room.availableBeds }).map((_, i) => (
                          <BedIcon key={`avail-${i}`} status="available" />
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                        <div
                          className={`h-1.5 rounded-full transition-all ${occupancyPct >= 75 ? "bg-amber-500" : "bg-indigo-500"}`}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {room.occupiedBeds.length}/{room.bedCount} giường · {room.availableBeds} trống
                      </div>

                      {/* Show admitted patients */}
                      {room.occupiedBeds.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-1">
                          {room.occupiedBeds.slice(0, 2).map((p: User) => (
                            <div key={p._id} className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={p.image || ""} />
                                <AvatarFallback className="text-[8px] bg-indigo-100 text-indigo-700">
                                  {p.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs truncate">{p.name}</span>
                            </div>
                          ))}
                          {room.occupiedBeds.length > 2 && (
                            <p className="text-[10px] text-muted-foreground">+{room.occupiedBeds.length - 2} bệnh nhân khác</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="card shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y">
                  {rooms.map((room) => {
                    const occupancyPct = Math.round((room.occupiedBeds.length / room.bedCount) * 100);
                    return (
                      <div key={room.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div className="w-20 shrink-0">
                          <span className="font-black">P.{room.number}</span>
                          <p className="text-xs text-muted-foreground">Tầng {room.floor}</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-1 mb-1">
                            {Array.from({ length: room.occupiedBeds.length }).map((_, i) => <BedIcon key={`o${i}`} status="occupied" />)}
                            {Array.from({ length: room.maintenanceBeds }).map((_, i) => <BedIcon key={`m${i}`} status="maintenance" />)}
                            {Array.from({ length: room.availableBeds }).map((_, i) => <BedIcon key={`a${i}`} status="available" />)}
                          </div>
                          <p className="text-xs text-muted-foreground">{room.department}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">{occupancyPct}% đầy</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
