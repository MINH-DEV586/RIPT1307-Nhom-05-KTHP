import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sparkles } from "lucide-react";
import type { User as UserType } from "@/types";

export default function History({ user }: { user: UserType }) {
  return (
    <div className="space-y-4">
      <Card className="bg-linear-to-br from-blue-50 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20 border-blue-100 dark:border-blue-900 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base text-blue-900 dark:text-blue-300">
              Tóm tắt y tế AI
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Dựa trên hồ sơ gần đây, bệnh nhân có tiền sử{" "}
            {user.medicalHistory || "không có vấn đề đáng kể"}. Các chỉ số sinh tồn hiện tại ổn định. Khuyến nghị: Theo dõi huyết áp trong quá trình theo dõi.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" /> Hồ sơ bệnh nhân
        </h3>
        <div className="p-4 rounded-lg border bg-white dark:bg-slate-900 text-sm shadow-sm">
          {user.medicalHistory || "Chưa có lịch sử y tế được ghi nhận."}
        </div>
      </div>
    </div>
  );
}
