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
  Zap,
  Lock,
  Globe,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MedFlow AI | Peak Hospital Management Experience" },
    {
      name: "description",
      content:
        "MedFlow AI - The next generation of healthcare management powered by real-time intelligence and AI-driven workflows.",
    },
  ];
}

const bentoFeatures = [
  {
    title: "Trí tuệ nhân tạo (AI)",
    desc: "Tự động phân tích chỉ số, gợi ý phác đồ và hỗ trợ chẩn đoán chính xác đến 98%.",
    icon: Brain,
    className: "md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20",
    iconColor: "text-indigo-500",
    tag: "Intelligence"
  },
  {
    title: "Dữ liệu thời gian thực",
    desc: "Cập nhật trạng thái phòng bệnh, thuốc và xét nghiệm tức thì.",
    icon: Activity,
    className: "md:col-span-1 md:row-span-1 bg-emerald-500/5 border-emerald-500/20",
    iconColor: "text-emerald-500",
    tag: "Real-time"
  },
  {
    title: "Bảo mật quân đội",
    desc: "Mã hóa đa lớp bảo vệ dữ liệu bệnh nhân.",
    icon: Lock,
    className: "md:col-span-1 md:row-span-1 bg-blue-500/5 border-blue-500/20",
    iconColor: "text-blue-500",
    tag: "Security"
  },
  {
    title: "Tư vấn 24/7",
    desc: "Phòng khám Messenger-style hiện đại.",
    icon: MessageSquare,
    className: "md:col-span-1 md:row-span-2 bg-pink-500/5 border-pink-500/20",
    iconColor: "text-pink-500",
    tag: "Communication"
  },
  {
    title: "Quản lý Nhà thuốc",
    desc: "Tối ưu tồn kho và phát thuốc tự động.",
    icon: Pill,
    className: "md:col-span-1 md:row-span-1 bg-orange-500/5 border-orange-500/20",
    iconColor: "text-orange-500",
    tag: "Pharmacy"
  },
  {
    title: "Cận lâm sàng",
    desc: "Quy trình xét nghiệm số hóa hoàn toàn.",
    icon: FlaskConical,
    className: "md:col-span-1 md:row-span-1 bg-cyan-500/5 border-cyan-500/20",
    iconColor: "text-cyan-500",
    tag: "Lab"
  },
];

const roles = [
  { icon: Shield, title: "Admin", desc: "Quản trị hệ thống", color: "from-slate-800 to-slate-900" },
  { icon: Stethoscope, title: "Bác sĩ", desc: "Khám & Điều trị", color: "from-blue-600 to-blue-700" },
  { icon: HeartPulse, title: "Điều dưỡng", desc: "Chăm sóc bệnh nhân", color: "from-emerald-600 to-emerald-700" },
  { icon: Pill, title: "Dược sĩ", desc: "Quản lý thuốc", color: "from-orange-600 to-orange-700" },
  { icon: FlaskConical, title: "Kỹ thuật viên", desc: "Thực hiện xét nghiệm", color: "from-violet-600 to-violet-700" },
  { icon: Users, title: "Bệnh nhân", desc: "Theo dõi hồ sơ", color: "from-rose-600 to-rose-700" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* ── STYLES (Inline for isolation) ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-scan { animation: scan 3s linear infinite; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .text-gradient { background: linear-gradient(to right, #818cf8, #c084fc, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />

      {/* ── NAVIGATION ── */}
      <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">MedFlow <span className="text-indigo-400">AI</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Công nghệ</a>
              <a href="#roles" className="hover:text-white transition-colors">Vai trò</a>
              <a href="#cta" className="hover:text-white transition-colors">Trải nghiệm</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Đăng nhập</Link>
              <Button asChild className="bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-semibold px-5 h-9">
                <Link to="/register">Bắt đầu ngay</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-8">
            <div className="flex justify-center">
              <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 rounded-md font-semibold text-[11px] tracking-wide">
                Thế hệ quản lý mới
              </Badge>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] text-white">
              Đỉnh cao <br />
              <span className="text-gradient">Y tế số</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed font-medium">
              Trải nghiệm hệ thống quản lý bệnh viện thông minh nhất hiện nay. Kết nối bác sĩ và bệnh nhân qua trí tuệ nhân tạo và dữ liệu thời gian thực.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="h-12 px-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95">
                <Link to="/register">
                  Đăng ký Bệnh nhân <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-lg border-slate-700 bg-white/5 hover:bg-white/10 text-white font-semibold text-base backdrop-blur-md">
                <Link to="/login">Cổng nội bộ</Link>
              </Button>
            </div>
            
            <div className="pt-12 flex items-center justify-center gap-12 opacity-60">
               <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-white">99.9%</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Tin cậy</span>
               </div>
               <div className="w-px h-12 bg-slate-800" />
               <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-white">AI</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400">Phân tích</span>
               </div>
               <div className="w-px h-12 bg-slate-800" />
               <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-white">&lt;10ms</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">Thời gian thực</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ── */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">Công nghệ đột phá</h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium">Hệ sinh thái MedFlow AI tích hợp những công nghệ tiên tiến nhất để phục vụ ngành y tế hiện đại.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
            {bentoFeatures.map((f, i) => (
              <div 
                key={i} 
                className={cn(
                  "relative glass rounded-xl p-8 overflow-hidden group hover:border-white/20 transition-all duration-300",
                  f.className
                )}
              >
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center glass", f.iconColor)}>
                      <f.icon className="w-6 h-6" />
                    </div>
                    <div>
                       <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest mb-2 border-white/10">{f.tag}</Badge>
                       <h3 className="text-2xl font-black text-white">{f.title}</h3>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-[250px]">{f.desc}</p>
                </div>
                
                {/* Decorative Background Icon */}
                <f.icon className={cn("absolute -bottom-10 -right-10 w-40 h-40 opacity-5 group-hover:opacity-10 transition-all duration-500 rotate-12", f.iconColor)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES GRID ── */}
      <section id="roles" className="py-32 bg-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">Cho mọi người</h2>
              <p className="text-slate-400 max-w-md font-medium">Một hệ thống đồng nhất nhưng tùy biến tối đa cho từng nhu cầu công việc.</p>
            </div>
            <div className="hidden md:flex gap-2">
               <div className="w-12 h-1 bg-indigo-600 rounded-full" />
               <div className="w-4 h-1 bg-slate-800 rounded-full" />
               <div className="w-4 h-1 bg-slate-800 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {roles.map((r, i) => (
              <div 
                key={i} 
                className="group relative h-64 glass rounded-xl p-6 flex flex-col justify-end overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-t", r.color)} />
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-xl", r.color)}>
                  <r.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-black text-white">{r.title}</h4>
                <p className="text-[11px] text-slate-500 font-bold group-hover:text-slate-300 transition-colors uppercase tracking-widest">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA MESH SECTION ── */}
      <section id="cta" className="py-32 px-6">
        <div className="max-w-6xl mx-auto relative rounded-2xl overflow-hidden bg-indigo-600 shadow-xl shadow-indigo-600/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.15)_0%,transparent_50%)]" />
          
          <div className="relative z-10 py-20 px-12 text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              Bắt đầu hành trình <br /> y tế mới ngay hôm nay
            </h2>
            <p className="text-indigo-100 text-base max-w-xl mx-auto font-medium">
              Đăng ký tài khoản miễn phí và trải nghiệm hệ thống quản lý bệnh viện hiện đại nhất.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="h-12 px-8 rounded-lg bg-white text-indigo-700 hover:bg-slate-50 font-semibold text-base shadow-lg transition-all hover:scale-[1.02] active:scale-95">
                <Link to="/register">Đăng ký miễn phí</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-lg border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold text-base backdrop-blur-md">
                <Link to="/login">Đăng nhập</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 border-t border-white/5 bg-[#01040f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-black text-2xl tracking-tighter text-white">MedFlow <span className="text-indigo-400">AI</span></span>
               </div>
               <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                 Kiến tạo tương lai y tế bằng trí tuệ nhân tạo và công nghệ kết nối thời gian thực.
               </p>
               <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                     <Globe className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                     <Database className="w-4 h-4 text-slate-400" />
                  </div>
               </div>
            </div>
            
            <div className="space-y-6">
               <h5 className="text-sm font-black uppercase tracking-widest text-white">Sản phẩm</h5>
               <ul className="space-y-3 text-sm font-medium text-slate-500">
                  <li className="hover:text-indigo-400 cursor-pointer transition-colors">Tính năng chính</li>
                  <li className="hover:text-indigo-400 cursor-pointer transition-colors">Bảo mật dữ liệu</li>
                  <li className="hover:text-indigo-400 cursor-pointer transition-colors">Cập nhật hệ thống</li>
               </ul>
            </div>

            <div className="space-y-6">
               <h5 className="text-sm font-black uppercase tracking-widest text-white">Công ty</h5>
               <ul className="space-y-3 text-sm font-medium text-slate-500">
                  <li className="hover:text-indigo-400 cursor-pointer transition-colors">Về chúng tôi</li>
                  <li className="hover:text-indigo-400 cursor-pointer transition-colors">Điều khoản dịch vụ</li>
                  <li className="hover:text-indigo-400 cursor-pointer transition-colors">Chính sách bảo mật</li>
               </ul>
            </div>
          </div>
          
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-bold text-slate-600 uppercase tracking-widest">
             <p>© 2026 MEDFLOW AI. ALL RIGHTS RESERVED.</p>
             <div className="flex gap-8">
                <span>Trạng thái: Ổn định</span>
                <span>Phiên bản: 2.0.4-Peak</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
