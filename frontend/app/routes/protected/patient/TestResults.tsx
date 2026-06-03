import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getPatientLabResults, explainLabResult } from "@/lib/api";
import { printMedicalDoc } from "@/lib/print";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FlaskConical, 
  Calendar, 
  FileSearch, 
  Download, 
  Eye, 
  ImageIcon,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  X
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function TestResults() {
  const { data: session } = authClient.useSession();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Explanation state
  const [explaining, setExplaining] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchResults();
    }
  }, [session?.user?.id]);

  const fetchResults = async () => {
    try {
      const data = await getPatientLabResults(session!.user.id);
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (id: string) => {
    setExplaining(id);
    setExplanation("");
    setIsDialogOpen(true);
    try {
      const data = await explainLabResult(id);
      setExplanation(data.explanation);
    } catch (error) {
      toast.error("Không thể kết nối với trợ lý AI");
      setIsDialogOpen(false);
    } finally {
      setExplaining(null);
    }
  };

  const handleDownloadOrPrint = (result: any) => {
    if (result.imageUrl) {
      const a = document.createElement("a");
      a.href = result.imageUrl;
      a.target = "_blank";
      a.download = `KetQua_${result.testType}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (result.indicators && result.indicators.length > 0) {
      const dateStr = format(new Date(result.createdAt), "dd/MM/yyyy", { locale: vi });
      
      let indicatorsHtml = result.indicators.map((ind: any, idx: number) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${ind.name}</strong></td>
          <td>${ind.value}</td>
          <td>${ind.unit || ""}</td>
          <td>${ind.referenceRange || ""}</td>
        </tr>
      `).join('');

      const html = `
        <div style="margin-bottom: 20px;">
          <p><strong>Bệnh nhân:</strong> ${session?.user?.name || "Bệnh nhân"}</p>
          <p><strong>Loại xét nghiệm:</strong> ${result.testType}</p>
          <p><strong>Ngày thực hiện:</strong> ${dateStr}</p>
          ${result.doctorNotes ? `<p><strong>Ghi chú của bác sĩ:</strong> ${result.doctorNotes}</p>` : ""}
        </div>

        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên chỉ số</th>
              <th>Giá trị</th>
              <th>Đơn vị</th>
              <th>Khoảng tham chiếu</th>
            </tr>
          </thead>
          <tbody>
            ${indicatorsHtml}
          </tbody>
        </table>
      `;

      printMedicalDoc("KẾT QUẢ XÉT NGHIỆM", html);
    } else {
      toast.error("Không có dữ liệu để tải xuống hoặc in");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">Hoàn thành</Badge>;
      case "analyzed":
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20">Đã phân tích</Badge>;
      case "reviewed":
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20">Đã kiểm tra</Badge>;
      default:
        return <Badge variant="secondary">Đang chờ</Badge>;
    }
  };

  const getIcon = (testType: string) => {
    const type = testType.toLowerCase();
    if (type.includes("x-ray") || type.includes("x quang")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type.includes("mri") || type.includes("ct")) return <ImageIcon className="w-8 h-8 text-sky-500" />;
    if (type.includes("máu") || type.includes("blood")) return <FlaskConical className="w-8 h-8 text-rose-500" />;
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader label="Đang tải kết quả..." /></div>;

  return (
    <div className="w-full space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <FlaskConical className="w-8 h-8 text-primary" />
          </div>
          Kết quả xét nghiệm & Hình ảnh
        </h1>
        <p className="text-muted-foreground text-lg ml-1">
          Xem và tải xuống các kết quả xét nghiệm máu, ảnh chụp X-quang, MRI trực tuyến.
        </p>
      </div>

      {results.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileSearch className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Chưa có kết quả nào</h3>
            <p className="text-muted-foreground max-w-xs mt-2">
              Kết quả xét nghiệm và chẩn đoán hình ảnh của bạn sẽ được cập nhật tại đây ngay khi có.
            </p>
          </CardContent>
        </Card>
      ) : (() => {
        // Group results by date
        const grouped = results.reduce((acc: Record<string, any[]>, r) => {
          const dateKey = format(new Date(r.createdAt), "yyyy-MM-dd");
          if (!acc[dateKey]) acc[dateKey] = [];
          acc[dateKey].push(r);
          return acc;
        }, {});
        const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

        return (
          <div className="space-y-10">
            {sortedDates.map((dateKey) => (
              <div key={dateKey} className="space-y-4">
                {/* Date header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-md shadow-emerald-500/20">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(dateKey), "EEEE, dd/MM/yyyy", { locale: vi })}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent dark:from-emerald-800" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {grouped[dateKey].length} kết quả
                  </span>
                </div>

                {/* Cards grid 2 columns */}
                <div className="grid gap-6 md:grid-cols-2">
                  {grouped[dateKey].map((result) => (
                    <Card key={result._id} className="group overflow-hidden border-none shadow-xl bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300 card-hover border-l-4 border-l-primary/30">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="p-3 bg-background/50 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-sm border border-primary/5">
                            {getIcon(result.testType)}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(result.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 gap-2 font-bold"
                              onClick={() => handleExplain(result._id)}
                            >
                              <Sparkles className="w-4 h-4 animate-pulse" />
                              Hỏi AI
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 space-y-1">
                          <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                            {result.testType}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            Thực hiện: {format(new Date(result.createdAt), "dd/MM/yyyy", { locale: vi })}
                            {result.bodyPart && (
                              <>
                                <span className="mx-1">•</span>
                                Vị trí: {result.bodyPart}
                              </>
                            )}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {result.indicators && result.indicators.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chỉ số chính</h4>
                            <div className="grid gap-2">
                              {result.indicators.slice(0, 3).map((ind: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-background/30 text-sm">
                                  <span className="text-muted-foreground">{ind.name}</span>
                                  <span className="font-bold">{ind.value} {ind.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.aiAnalysis && (
                          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <div className="flex items-center gap-2 text-blue-600 font-bold mb-1 text-xs uppercase tracking-tighter">
                              <CheckCircle2 className="w-3 h-3" />
                              Phân tích AI
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 italic">
                              {result.aiAnalysis}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          {result.imageUrl && (
                            <Button className="flex-1 gap-2 shadow-lg shadow-primary/20" asChild>
                              <a href={result.imageUrl} target="_blank" rel="noreferrer">
                                <Eye className="w-4 h-4" />
                                Xem trực tuyến
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" className="flex-1 gap-2 bg-background/50" onClick={() => handleDownloadOrPrint(result)}>
                            <Download className="w-4 h-4" />
                            Tải PDF/Ảnh
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* AI Explanation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-blue-500/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-blue-600">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              Trợ lý Sức khỏe AI
            </DialogTitle>
            <DialogDescription>
              Giải thích chi tiết kết quả xét nghiệm của bạn bằng ngôn ngữ dễ hiểu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 min-h-[200px]">
            {!explanation && explaining ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <Sparkles className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-blue-600 font-medium animate-pulse">AI đang phân tích kết quả của bạn...</p>
              </div>
            ) : (
              <div className="prose prose-indigo dark:prose-invert max-w-none prose-sm">
                <div className="space-y-4">
                  <ReactMarkdown>
                    {explanation}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800/80 leading-relaxed">
              <strong>Lưu ý quan trọng:</strong> Thông tin này do AI tạo ra để hỗ trợ bạn hiểu các thuật ngữ y tế. Nó không thay thế cho lời khuyên, chẩn đoán hoặc điều trị y tế chuyên nghiệp. Luôn trao đổi trực tiếp với bác sĩ về kết quả của bạn.
            </p>
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Đóng</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 gap-2">
              <MessageSquare className="w-4 h-4" />
              Hỏi thêm bác sĩ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
