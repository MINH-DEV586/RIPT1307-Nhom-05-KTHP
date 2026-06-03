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
    <div className="space-y-8 pb-10">
      {/* Header and Save Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Thiết lập lịch làm việc</h1>
          <p className="text-muted-foreground">
            Quản lý thời gian khám bệnh, khung giờ nghỉ và số lượng bệnh nhân tối đa.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          className="h-11 px-8 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-sm gap-2 whitespace-nowrap"
          disabled={mutation.isPending}
        >
          <Save className="w-5 h-5" />
          {mutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: 8/12 Width */}
        <div className="lg:col-span-8 space-y-6">
          {/* Working Days */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Ngày làm việc trong tuần
              </CardTitle>
              <CardDescription>Chọn những ngày bạn sẵn sàng tiếp nhận bệnh nhân.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {DAYS.map((day) => {
                  const isSelected = formData.workingDays.includes(day.id);
                  return (
                    <div 
                      key={day.id}
                      className={`flex items-center space-x-3 p-4 rounded-md border transition-colors ${
                        isSelected 
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20" 
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      }`}
                    >
                      <Checkbox 
                        id={`day-${day.id}`}
                        checked={isSelected} 
                        onCheckedChange={() => toggleDay(day.id)}
                        className={isSelected ? "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" : ""}
                      />
                      <Label 
                        htmlFor={`day-${day.id}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {day.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Limits */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Giới hạn & Định dạng ca khám
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
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian mỗi ca khám (phút)</Label>
                  <Input 
                    type="number" 
                    value={formData.slotDuration}
                    onChange={(e) => setFormData({...formData, slotDuration: parseInt(e.target.value)})}
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: 4/12 Width */}
        <div className="lg:col-span-4 space-y-6">
          {/* Working Hours */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc</Label>
                  <Input 
                    type="time" 
                    value={formData.workingHours.end}
                    onChange={(e) => setFormData({...formData, workingHours: {...formData.workingHours, end: e.target.value}})}
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Break Time */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-2 text-base">
                <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-500" />
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
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc</Label>
                  <Input 
                    type="time" 
                    value={formData.breakTime.end}
                    onChange={(e) => setFormData({...formData, breakTime: {...formData.breakTime, end: e.target.value}})}
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900 flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Việc cập nhật lịch làm việc sẽ không ảnh hưởng đến các lịch hẹn đã được xác nhận trước đó. 
              Hệ thống sẽ tự động tính toán các slot trống dựa trên cài đặt này.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

