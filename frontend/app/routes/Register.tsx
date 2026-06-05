import type { Route } from "../+types/root";
import {
  Activity,
  Lock,
  Mail,
  User,
  ChevronRight,
  AlertCircle,
  Phone,
  Calendar,
  HeartPulse,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { CustomInput } from "@/components/global/CustomInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useState } from "react";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Link, useNavigate, Navigate } from "react-router";
import Loader from "@/components/global/Loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Đăng ký tài khoản | MedFlow AI" },
    {
      name: "description",
      content: "Tạo tài khoản bệnh nhân để đặt lịch khám, xem hồ sơ bệnh án và thanh toán trực tuyến.",
    },
  ];
}

const registerSchema = z
  .object({
    name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
    gender: z.string().optional(),
    age: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const benefits = [
  "Đặt lịch khám với bác sĩ chuyên khoa",
  "Xem hồ sơ bệnh án và đơn thuốc trực tuyến",
  "Nhận kết quả xét nghiệm tức thì",
  "Tư vấn sức khỏe từ xa qua chat",
  "Thanh toán viện phí online an toàn",
];

export default function Register() {
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gender, setGender] = useState("");
  const navigate = useNavigate();
  
  const [session, setSession] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.session) {
        setSession(data);
      }
      setIsPending(false);
    }).catch(() => {
      setIsPending(false);
    });
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: "",
      age: "",
    },
  });

  if (isPending) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader label="Đang tải..." />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: RegisterFormValues) => {
    setGlobalError("");
    setIsLoading(true);
    await authClient.signUp.email(
      {
        email: data.email,
        password: data.password,
        name: data.name,
        // Better Auth admin plugin sets defaultRole = "patient"
      },
      {
        onSuccess: () => {
          toast.success("Tạo tài khoản thành công! Chào mừng bạn đến với MedFlow AI.");
          navigate("/dashboard");
        },
        onError: (ctx) => {
          setGlobalError(ctx.error.message || "Đã xảy ra lỗi khi đăng ký.");
        },
      },
    );
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left panel – branding & benefits */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-gradient-to-b from-blue-800 to-blue-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight">MedFlow AI</span>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-black leading-tight mb-4">
              Chăm sóc sức khỏe thông minh dành cho bạn
            </h2>
            <p className="text-blue-200 text-base leading-relaxed">
              Tạo tài khoản bệnh nhân miễn phí và trải nghiệm dịch vụ y tế hiện đại, tiện lợi ngay từ hôm nay.
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-blue-100 text-sm font-medium">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-xs">
          © 2026 MedFlow AI — Hệ thống bảo mật & tuân thủ HIPAA
        </p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-blue-700 p-2 rounded-xl">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl text-slate-900 dark:text-white">MedFlow AI</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Tạo tài khoản bệnh nhân
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Đăng ký miễn phí, không cần thẻ tín dụng.
            </p>
          </div>

          {globalError && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm flex items-center gap-3 border border-red-100 dark:border-red-900/50 animate-in slide-in-from-top-2 fade-in">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-medium">{globalError}</span>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <CustomInput
              control={form.control}
              name="name"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              type="text"
              startIcon={<User size={17} />}
            />

            <CustomInput
              control={form.control}
              name="email"
              label="Địa chỉ Email"
              placeholder="example@email.com"
              type="email"
              startIcon={<Mail size={17} />}
            />

            {/* Gender & Age row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Giới tính
                </Label>
                <Select
                  value={gender}
                  onValueChange={(v) => {
                    setGender(v);
                    form.setValue("gender", v);
                  }}
                >
                  <SelectTrigger
                    id="gender-select"
                    className="h-12 bg-background border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <SelectValue placeholder="Chọn..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <CustomInput
                control={form.control}
                name="age"
                label="Tuổi"
                placeholder="25"
                type="number"
                startIcon={<Calendar size={17} />}
              />
            </div>

            <CustomInput
              control={form.control}
              name="password"
              label="Mật khẩu"
              placeholder="••••••••  (tối thiểu 8 ký tự)"
              type="password"
              startIcon={<Lock size={17} />}
            />

            <CustomInput
              control={form.control}
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              placeholder="••••••••"
              type="password"
              startIcon={<Lock size={17} />}
            />

            <Button
              type="submit"
              id="register-submit-btn"
              disabled={isLoading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl py-6 font-bold text-base shadow-md shadow-blue-700/20 transition-all active:scale-[0.98] group mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang tạo tài khoản...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Tạo tài khoản ngay
                  <ChevronRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              Đăng nhập tại đây
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4 leading-relaxed">
            Bằng cách đăng ký, bạn đồng ý với{" "}
            <span className="underline cursor-pointer">Điều khoản sử dụng</span> và{" "}
            <span className="underline cursor-pointer">Chính sách bảo mật</span> của MedFlow AI.
          </p>
        </div>
      </div>
    </div>
  );
}
