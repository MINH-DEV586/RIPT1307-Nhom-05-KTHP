import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Coffee } from "lucide-react";

interface ScheduleOverviewProps {
  schedule: {
    workingDays: string[];
    workingHours: { start: string; end: string };
    breakTime: { start: string; end: string };
    slotDuration: number;
  };
  title?: string;
  showBreak?: boolean;
}

const DAY_LABELS: Record<string, string> = {
  Monday: "Thứ 2",
  Tuesday: "Thứ 3",
  Wednesday: "Thứ 4",
  Thursday: "Thứ 5",
  Friday: "Thứ 6",
  Saturday: "Thứ 7",
  Sunday: "Chủ nhật",
};

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function ScheduleOverview({ schedule, title = "Lịch làm việc", showBreak = true }: ScheduleOverviewProps) {
  if (!schedule) return null;

  return (
    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
          <CalendarDays className="w-4 h-4" />
          {title}
        </h4>
        
        {/* Working Days */}
        <div className="flex flex-wrap gap-2">
          {DAYS_ORDER.map((day) => (
            <Badge 
              key={day}
              variant={schedule.workingDays.includes(day) ? "default" : "outline"}
              className={`
                px-2 py-1 text-[10px] uppercase font-bold
                ${schedule.workingDays.includes(day) ? "bg-blue-600 hover:bg-blue-600" : "text-muted-foreground opacity-50"}
              `}
            >
              {DAY_LABELS[day]}
            </Badge>
          ))}
        </div>

        {/* Hours */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Giờ làm việc
            </p>
            <p className="text-sm font-black">
              {schedule.workingHours.start} - {schedule.workingHours.end}
            </p>
          </div>
          
          {showBreak && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Coffee className="w-3 h-3" /> Nghỉ trưa
              </p>
              <p className="text-sm font-black">
                {schedule.breakTime.start} - {schedule.breakTime.end}
              </p>
            </div>
          )}
        </div>
        
        <p className="text-[10px] text-muted-foreground italic">
          * Mỗi ca khám kéo dài khoảng {schedule.slotDuration} phút.
        </p>
      </CardContent>
    </Card>
  );
}
