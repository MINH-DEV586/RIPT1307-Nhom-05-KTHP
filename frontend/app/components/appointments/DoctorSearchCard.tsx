import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, MapPin, Briefcase, DollarSign, ArrowRight } from "lucide-react";
import type { User } from "@/app/types";

interface DoctorSearchCardProps {
  doctor: User;
  onSelect: (doctor: User) => void;
}

export function DoctorSearchCard({ doctor, onSelect }: DoctorSearchCardProps) {
  return (
    <Card className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-card/50 backdrop-blur-md">
      <CardContent className="p-0">
        <div className="relative h-32 bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-colors">
          <div className="absolute -bottom-10 left-6">
            <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
              <AvatarImage src={doctor.image || ""} />
              <AvatarFallback className="bg-indigo-500 text-white font-bold text-xl">
                {doctor.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute top-4 right-4">
            <Badge className={doctor.isOnline ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-400"}>
              {doctor.isOnline ? "Trực tuyến" : "Ngoại tuyến"}
            </Badge>
          </div>
        </div>
        
        <div className="pt-12 px-6 pb-6 space-y-4">
          <div>
            <h3 className="text-xl font-black group-hover:text-indigo-600 transition-colors">{doctor.name}</h3>
            <p className="text-indigo-600 font-bold text-sm">{doctor.specialization || "Chuyên gia y tế"}</p>
          </div>

          <div className="grid grid-cols-2 gap-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>{doctor.experience || "5+ năm"} kinh nghiệm</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{doctor.rating || 5.0} Rating</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>{doctor.consultationFee?.toLocaleString()} VNĐ</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sẵn sàng: 08:00 - 17:00</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex gap-1 flex-wrap">
              {["T2", "T3", "T4", "T5", "T6"].map(day => (
                <Badge key={day} variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/50">
                  {day}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/20 border-t flex justify-between items-center">
        <span className="text-xs font-bold text-muted-foreground">Slot trống: 12</span>
        <Button onClick={() => onSelect(doctor)} size="sm" className="gap-1 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
          Đặt lịch ngay <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
