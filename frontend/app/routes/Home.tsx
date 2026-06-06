import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { Route } from "./+types/home";
import {
  Brain,
  Activity,
  Users,
  FlaskConical,
  Pill,
  MessageSquare,
  ArrowRight,
  Stethoscope,
  HeartPulse,
  Shield,
  BedDouble,
  CheckCircle,
  Phone,
  Clock,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MedFlow AI | Hệ thống quản lý bệnh viện thông minh" },
    {
      name: "description",
      content:
        "MedFlow AI - Hệ thống quản lý bệnh viện tích hợp AI, hỗ trợ đặt lịch, xét nghiệm, nhà thuốc và tư vấn trực tuyến.",
    },
  ];
}

const features = [
  {
    title: "Trí tuệ nhân tạo",
    desc: "Phân tích ảnh X-quang và hỗ trợ chẩn đoán bằng Google Gemini AI.",
    icon: Brain,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    title: "Cập nhật thời gian thực",
    desc: "Trạng thái giường bệnh, lịch hẹn và kết quả xét nghiệm cập nhật ngay lập tức.",
    icon: Activity,
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    title: "Quản lý giường bệnh",
    desc: "Sơ đồ giường bệnh trực quan theo tầng và khoa, phân công bệnh nhân dễ dàng.",
    icon: BedDouble,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-100",
  },
  {
    title: "Nhà thuốc điện tử",
    desc: "Quản lý kho dược, kê đơn điện tử và theo dõi hạn sử dụng thuốc tự động.",
    icon: Pill,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  {
    title: "Phòng xét nghiệm",
    desc: "Số hóa quy trình xét nghiệm — từ yêu cầu đến kết quả trên hồ sơ bệnh nhân.",
    icon: FlaskConical,
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
  },
  {
    title: "Khám bệnh từ xa",
    desc: "Tư vấn trực tuyến qua video call và chat realtime giữa bác sĩ và bệnh nhân.",
    icon: MessageSquare,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
];

const roles = [
  { icon: Shield, title: "Quản trị viên", desc: "Toàn quyền hệ thống" },
  { icon: Stethoscope, title: "Bác sĩ", desc: "Khám & điều trị" },
  { icon: HeartPulse, title: "Điều dưỡng", desc: "Chăm sóc bệnh nhân" },
  { icon: Pill, title: "Dược sĩ", desc: "Quản lý thuốc" },
  { icon: FlaskConical, title: "Kỹ thuật viên", desc: "Xét nghiệm" },
  { icon: Users, title: "Bệnh nhân", desc: "Theo dõi sức khỏe" },
];

const stats = [
  { label: "Bệnh nhân tin dùng", value: "10,000+" },
  { label: "Bác sĩ & chuyên gia", value: "500+" },
  { label: "Thời gian hoạt động", value: "99.9%" },
  { label: "Phản hồi realtime", value: "<10ms" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">
              MedFlow <span className="text-blue-700">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-700 transition-colors">
              Tính năng
            </a>
            <a href="#roles" className="hover:text-blue-700 transition-colors">
              Đối tượng
            </a>
            <a href="#cta" className="hover:text-blue-700 transition-colors">
              Liên hệ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors px-3 py-2"
            >
              Đăng nhập
            </Link>
            <Button
              asChild
              className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-5 h-9 text-sm font-semibold shadow-sm"
            >
              <Link to="/register">Đăng ký miễn phí</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-b from-blue-50/70 to-white pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-xs font-semibold">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Hệ thống quản lý bệnh viện tích hợp AI
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
            Quản lý bệnh viện thông minh,
            <br />
            <span className="text-blue-700">hiện đại và toàn diện</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            MedFlow AI kết nối đội ngũ y tế và bệnh nhân trên một nền tảng duy nhất — từ đặt lịch,
            khám bệnh, xét nghiệm, đến thanh toán và theo dõi sức khỏe.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-8 h-12 font-semibold shadow-md"
            >
              <Link to="/register">
                Bắt đầu sử dụng <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-lg px-8 h-12 font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Link to="/login">Đăng nhập hệ thống</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              Miễn phí đăng ký bệnh nhân
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              Cập nhật dữ liệu thời gian thực
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              Bảo mật dữ liệu y tế
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-blue-700">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Tính năng nổi bật
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Toàn bộ quy trình quản lý bệnh viện trong một hệ thống thống nhất, dễ dùng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl p-6 border ${f.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}
                >
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-slate-900 text-base mb-1.5">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Dành cho mọi đối tượng
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Mỗi vai trò có giao diện và quyền hạn riêng, phù hợp với công việc thực tế tại bệnh viện.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {roles.map((r, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-xl p-5 text-center border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <r.icon className="w-5 h-5 text-blue-700" />
                </div>
                <h4 className="font-semibold text-slate-800 text-sm">{r.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHT STRIP */}
      <section className="py-16 bg-blue-700">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center">
            <div className="space-y-2">
              <Phone className="w-7 h-7 mx-auto text-blue-200" />
              <h3 className="font-semibold text-lg">Hỗ trợ 24/7</h3>
              <p className="text-blue-100 text-sm">
                Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ mọi sự cố.
              </p>
            </div>
            <div className="space-y-2">
              <Clock className="w-7 h-7 mx-auto text-blue-200" />
              <h3 className="font-semibold text-lg">Triển khai nhanh</h3>
              <p className="text-blue-100 text-sm">
                Bắt đầu sử dụng ngay, không cần cài đặt phức tạp.
              </p>
            </div>
            <div className="space-y-2">
              <Shield className="w-7 h-7 mx-auto text-blue-200" />
              <h3 className="font-semibold text-lg">Bảo mật dữ liệu</h3>
              <p className="text-blue-100 text-sm">
                Dữ liệu bệnh nhân được mã hóa và bảo vệ nghiêm ngặt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-slate-500 text-base max-w-lg mx-auto">
            Đăng ký tài khoản bệnh nhân miễn phí và trải nghiệm hệ thống quản lý bệnh viện thông minh ngay hôm nay.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-8 h-12 font-semibold shadow-md"
            >
              <Link to="/register">
                Đăng ký ngay <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-lg px-8 h-12 font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Link to="/login">Đăng nhập hệ thống</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white text-base">MedFlow AI</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Hệ thống quản lý bệnh viện thông minh tích hợp AI và dữ liệu thời gian thực.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 text-sm">
              <div className="space-y-3">
                <h5 className="text-white font-semibold text-xs uppercase tracking-wider">
                  Sản phẩm
                </h5>
                <ul className="space-y-2 text-slate-500">
                  <li className="hover:text-white cursor-pointer transition-colors">Tính năng</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Bảo mật</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Cập nhật</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="text-white font-semibold text-xs uppercase tracking-wider">
                  Hỗ trợ
                </h5>
                <ul className="space-y-2 text-slate-500">
                  <li className="hover:text-white cursor-pointer transition-colors">Về chúng tôi</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Điều khoản</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Chính sách bảo mật</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <p>© 2026 MedFlow AI. All rights reserved.</p>
            <p>Phiên bản 2.0 · Trạng thái: Ổn định</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
