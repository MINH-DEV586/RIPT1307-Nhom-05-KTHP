import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { HeartPulse, Home, ArrowLeft } from "lucide-react";

export function meta() {
  return [{ title: "404 - Không tìm thấy trang | MedFlow AI" }];
}

export function ErrorBoundary() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/25">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* 404 */}
        <div>
          <p className="text-8xl font-black text-blue-600/20 dark:text-blue-500/10 select-none leading-none">
            404
          </p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            Trang không tồn tại
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
            Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển. Hãy kiểm tra lại đường dẫn hoặc quay về trang chính.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to={-1 as any}>
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Link to="/dashboard">
              <Home className="w-4 h-4" /> Về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return <ErrorBoundary />;
}
