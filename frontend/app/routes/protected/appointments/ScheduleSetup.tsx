import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDoctorSchedule, updateDoctorSchedule } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CalendarDays, Clock, Save, Coffee, Users, Info } from "lucide-react";
import Loader from "@/components/global/Loader";

const DAYS = [
  { id: "Monday", label: "Thứ 2" },
  { id: "Tuesday", label: "Thứ 3" },
  { id: "Wednesday", label: "Thứ 4" },
  { id: "Thursday", label: "Thứ 5" },
  { id: "Friday", label: "Thứ 6" },
  { id: "Saturday", label: "Thứ 7" },
  { id: "Sunday", label: "Chủ nhật" },
];

export default function ScheduleSetup() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    workingDays: [] as string[],
    workingHours: { start: "08:00", end: "17:00" },
    breakTime: { start: "12:00", end: "13:00" },
    maxPatientsPerDay: 20,
    slotDuration: 30,
  });

  const { isLoading } = useQuery({
    queryKey: ["doctor-schedule", session?.user?.id],
    queryFn: async () => {
      const data = await getDoctorSchedule(session!.user.id);
      if (data) {
        setFormData(data);
      }
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const mutation = useMutation({
    mutationFn: updateDoctorSchedule,
    onSuccess: () => {
      toast.success("Đã cập nhật lịch làm việc thành công!");
      queryClient.invalidateQueries({ queryKey: ["doctor-schedule"] });
    },
    onError: () => {
      toast.error("Lỗi khi cập nhật lịch làm việc.");
    }
  });

  const toggleDay = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(dayId)
        ? prev.workingDays.filter(d => d !== dayId)
        : [...prev.workingDays, dayId]
    }));
  };

  const handleSave = () => {
    if (formData.workingDays.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ngày làm việc.");
      return;
    }
    mutation.mutate(formData);
  };

  if (isLoading) return <div className="h-[60vh] flex items-center justify-center"><Loader label="Đang tải lịch làm việc..." /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight">Thiết lập lịch làm việc</h1>
        <p className="text-muted-foreground text-lg">
          Quản lý thời gian khám bệnh, khung giờ nghỉ và số lượng bệnh nhân tối đa.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Working Days */}
        <Card className="card shadow-xl overflow-hidden border-none bg-card/50 backdrop-blur-md">
          <CardHeader className="bg-indigo-600/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              Ngày làm việc trong tuần
            </CardTitle>
            <CardDescription>Chọn những ngày bạn sẵn sàng tiếp nhận bệnh nhân.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              {DAYS.map((day) => {
                const isSelected = formData.workingDays.includes(day.id);
                return (
                  <div 
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all w-28
                      ${isSelected 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
                        : "bg-background border-border hover:border-indigo-300"}
                    `}
                  >
                    <span className="text-sm font-bold">{day.label}</span>
                    <Checkbox checked={isSelected} className="mt-2 border-white/50" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Working Hours */}
          <Card className="card shadow-xl overflow-hidden border-none bg-card/50 backdrop-blur-md">
            <CardHeader className="bg-emerald-600/10 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-emerald-600" />
                Thời gian làm việc
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bắt đầu</Label>
                  <Input 
                    type="time" 
                    value={formData.workingHours.start}
                    onChange={(e) => setFormData({...formData, workingHours: {...formData.workingHours, start: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc</Label>
                  <Input 
                    type="time" 
                    value={formData.workingHours.end}
                    onChange={(e) => setFormData({...formData, workingHours: {...formData.workingHours, end: e.target.value}})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Break Time */}
          <Card className="card shadow-xl overflow-hidden border-none bg-card/50 backdrop-blur-md">
            <CardHeader className="bg-amber-600/10 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Coffee className="w-4 h-4 text-amber-600" />
                Thời gian nghỉ trưa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bắt đầu</Label>
                  <Input 
                    type="time" 
                    value={formData.breakTime.start}
                    onChange={(e) => setFormData({...formData, breakTime: {...formData.breakTime, start: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc</Label>
                  <Input 
                    type="time" 
                    value={formData.breakTime.end}
                    onChange={(e) => setFormData({...formData, breakTime: {...formData.breakTime, end: e.target.value}})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Limits */}
        <Card className="card shadow-xl overflow-hidden border-none bg-card/50 backdrop-blur-md">
          <CardHeader className="bg-blue-600/10 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-blue-600" />
              Giới hạn & Định dạng
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Số bệnh nhân tối đa / ngày</Label>
                <Input 
                  type="number" 
                  value={formData.maxPatientsPerDay}
                  onChange={(e) => setFormData({...formData, maxPatientsPerDay: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Thời gian mỗi ca khám (phút)</Label>
                <Input 
                  type="number" 
                  value={formData.slotDuration}
                  onChange={(e) => setFormData({...formData, slotDuration: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-200 flex gap-3 items-start">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 font-medium">
            Việc cập nhật lịch làm việc sẽ không ảnh hưởng đến các lịch hẹn đã được xác nhận trước đó. 
            Hệ thống sẽ tự động tính toán các slot trống dựa trên cài đặt này.
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          className="w-full py-8 text-lg font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 gap-2"
          disabled={mutation.isPending}
        >
          <Save className="w-6 h-6" />
          {mutation.isPending ? "Đang lưu..." : "Lưu cài đặt lịch làm việc"}
        </Button>
      </div>
    </div>
  );
}
