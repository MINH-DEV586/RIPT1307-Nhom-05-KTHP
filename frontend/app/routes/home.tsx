import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Route } from "./+types/home";
import {
  Brain,
  Shield,
  Activity,
  Users,
  FlaskConical,
  Pill,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  HeartPulse,
  Clock,
  Star,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MedFlow AI | Hệ thống quản lý bệnh viện thông minh" },
    {
      name: "description",
      content:
        "MedFlow AI - Giải pháp quản lý bệnh viện thời gian thực tích hợp AI. Tối ưu hóa quy trình khám chữa bệnh, quản lý nhân sự và tài chính bệnh viện.",
    },
  ];
}

const features = [
  {
    icon: Brain,
    title: "Trí tuệ nhân tạo",
    desc: "AI tự động phân loại bệnh nhân, phân tích hình ảnh X-quang và đề xuất phác đồ điều trị tối ưu.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: Activity,
    title: "Thời gian thực",
    desc: "Cập nhật trạng thái bệnh nhân, phân công bác sĩ và kết quả xét nghiệm tức thì qua Socket.IO.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Shield,
    title: "Bảo mật cao",
    desc: "Phân quyền chi tiết theo vai trò (RBAC), mã hóa dữ liệu và xác thực an toàn với Better Auth.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: FlaskConical,
    title: "Phòng xét nghiệm",
    desc: "Quản lý toàn bộ quy trình xét nghiệm từ yêu cầu, thực hiện đến trả kết quả cho bệnh nhân.",
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    icon: Pill,
    title: "Nhà thuốc",
    desc: "Hệ thống kê đơn, quản lý kho dược và phát thuốc tự động, tránh tương tác thuốc nguy hiểm.",
    color: "from-orange-500 to-red-600",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    icon: MessageSquare,
    title: "Khám từ xa",
    desc: "Chat và tư vấn từ xa giữa bác sĩ và bệnh nhân theo thời gian thực, kết nối mọi lúc mọi nơi.",
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime đảm bảo", icon: CheckCircle2 },
  { value: "<50ms", label: "Độ trễ thời gian thực", icon: Clock },
  { value: "6+", label: "Vai trò người dùng", icon: Users },
  { value: "AI", label: "Phân tích thông minh", icon: Brain },
];

const roles = [
  { icon: Shield, title: "Quản trị viên", desc: "Toàn quyền kiểm soát hệ thống, người dùng và tài chính.", color: "bg-slate-800 dark:bg-slate-700" },
  { icon: Stethoscope, title: "Bác sĩ", desc: "Quản lý bệnh nhân, kê đơn và xem kết quả xét nghiệm.", color: "bg-blue-600" },
  { icon: HeartPulse, title: "Điều dưỡng", desc: "Hỗ trợ theo dõi và chăm sóc bệnh nhân nội trú.", color: "bg-emerald-600" },
  { icon: Pill, title: "Dược sĩ", desc: "Xử lý đơn thuốc và quản lý kho dược của bệnh viện.", color: "bg-orange-600" },
  { icon: FlaskConical, title: "Kỹ thuật viên", desc: "Thực hiện xét nghiệm và nhập kết quả cho bệnh nhân.", color: "bg-violet-600" },
  { icon: Users, title: "Bệnh nhân", desc: "Xem hồ sơ, lịch sử khám và thanh toán trực tuyến.", color: "bg-rose-600" },
];

const testimonials = [
  {
    name: "BS. Nguyễn Văn Hùng",
    role: "Trưởng khoa Nội tổng quát",
    content: "MedFlow AI đã giúp chúng tôi giảm 40% thời gian xử lý hồ sơ bệnh nhân. Tính năng AI phân tích X-quang thực sự ấn tượng.",
    rating: 5,
  },
  {
    name: "DS. Trần Thị Mai",
    role: "Trưởng khoa Dược",
    content: "Hệ thống quản lý kho dược và phát thuốc rất trực quan. Chúng tôi không còn lo ngại về sai sót tương tác thuốc nữa.",
    rating: 5,
  },
  {
    name: "ĐD. Lê Thành Công",
    role: "Điều dưỡng trưởng",
    content: "Thông báo thời gian thực giúp tôi nắm bắt tình trạng bệnh nhân ngay lập tức. Ứng dụng cực kỳ dễ dùng.",
    rating: 5,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl text-slate-900 dark:text-white">MedFlow <span className="text-indigo-600">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Tính năng</a>
            <a href="#roles" className="hover:text-indigo-600 transition-colors">Vai trò</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Đánh giá</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="font-semibold">
              <Link to="/login">Đăng nhập</Link>
            </Button>
            <Button asChild className="font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link to="/register">Đăng ký miễn phí <ArrowRight className="ml-1 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/3 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 px-4 py-1.5 text-sm font-semibold">
            <Brain className="w-3.5 h-3.5 mr-1.5" />
            Tích hợp Trí tuệ nhân tạo
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
            Hệ thống quản lý
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 bg-clip-text text-transparent">
              Bệnh viện thông minh
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
            MedFlow AI kết hợp công nghệ thời gian thực với trí tuệ nhân tạo để tối ưu hóa toàn bộ quy trình hoạt động của bệnh viện — từ tiếp nhận bệnh nhân, xét nghiệm, kê đơn đến thanh toán.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="font-bold text-base bg-indigo-600 hover:bg-indigo-700 text-white h-13 px-8 shadow-lg shadow-indigo-500/25">
              <Link to="/register">
                Đăng ký bệnh nhân miễn phí <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold text-base h-13 px-8">
              <Link to="/login">Đăng nhập với tài khoản của bạn</Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="w-5 h-5 mx-auto mb-2 text-indigo-500" />
                <div className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Giải pháp toàn diện
            </Badge>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
              Tất cả những gì bệnh viện cần
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Từ tiếp nhận bệnh nhân đến xuất viện, MedFlow AI phủ sóng toàn bộ nghiệp vụ bệnh viện trong một nền tảng duy nhất.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl ${f.bg} mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                <div className={`absolute inset-x-0 bottom-0 h-0.5 rounded-b-2xl bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
              Thiết kế cho từng vai trò
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              Giao diện và quyền truy cập được tùy chỉnh riêng cho từng vị trí trong bệnh viện.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div
                key={r.title}
                className="group flex flex-col gap-3 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-gray-900 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-gray-900/80 transition-all duration-200 cursor-default"
              >
                <div className={`w-10 h-10 rounded-xl ${r.color} flex items-center justify-center shadow-sm`}>
                  <r.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{r.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 bg-slate-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
              Đội ngũ y tế tin dùng
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Phản hồi từ các nhân viên y tế đang sử dụng MedFlow AI hàng ngày.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4 italic">
                  "{t.content}"
                </p>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            Sẵn sàng hiện đại hóa bệnh viện của bạn?
          </h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-2xl mx-auto">
            Trải nghiệm ngay MedFlow AI — hệ thống quản lý bệnh viện thông minh, nhanh chóng và bảo mật.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="font-bold text-base bg-white text-indigo-700 hover:bg-indigo-50 h-13 px-8 shadow-xl shadow-indigo-900/30">
              <Link to="/register">
                Đăng ký miễn phí ngay <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold text-base h-13 px-8 border-indigo-300 text-white hover:bg-white/10">
              <Link to="/login">Đăng nhập</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 bg-slate-900 dark:bg-gray-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <HeartPulse className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-white">MedFlow <span className="text-indigo-400">AI</span></span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 MedFlow AI. Hệ thống quản lý bệnh viện thông minh.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/register" className="hover:text-white transition-colors">Đăng ký</Link>
            <Link to="/login" className="hover:text-white transition-colors">Đăng nhập</Link>
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
