import * as z from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Họ tên là bắt buộc"),
  email: z.email("Địa chỉ email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),

  specialization: z.string().optional(),
  department: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  bloodgroup: z.string().optional(),
  medicalHistory: z.string().optional(),
  status: z.string().optional(),
});

export const userSchema = (isEdit: boolean) => {
  return z.object({
    name: z.string().min(2, "Họ tên là bắt buộc"),
    email: z.email("Địa chỉ email không hợp lệ"),
    specialization: z.string().optional(),
    department: z.string().optional(),
    age: z.string().optional(),
    gender: z.string().optional(),
    bloodgroup: z.string().optional(),
    medicalHistory: z.string().optional(),
    status: z.string().optional(),
    password: isEdit
      ? z
          .string()
          .optional()
          .refine((val) => !val || val.length >= 6, {
            message: "Mật khẩu phải có ít nhất 6 ký tự",
          })
      : z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  });
};

export type UserValues = z.infer<ReturnType<typeof userSchema>>;

export const GENDER_OPTIONS = [
  { label: "Nam", value: "Male" },
  { label: "Nữ", value: "Female" },
  { label: "Khác", value: "Other" },
];

export const BLOOD_GROUP_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
];

export const SPECIALIZATION_OPTIONS = [
  { label: "Tim mạch", value: "Cardiology" },
  { label: "Thần kinh", value: "Neurology" },
  { label: "Nhi khoa", value: "Pediatrics" },
  { label: "Đa khoa", value: "General" },
  { label: "Da liễu", value: "Dermatology" },
];

export const PATIENT_STATUS_OPTIONS = [
  { label: "Đã nhập viện", value: "admitted" },
  { label: "Đang điều trị", value: "in_treatment" },
  { label: "Đang theo dõi", value: "observation" },
  { label: "Đã xuất viện", value: "discharged" },
  { label: "Tái khám", value: "follow_up" },
];

export const STAFF_STATUS_OPTIONS = [
  { label: "Đang làm việc", value: "active" },
  { label: "Nghỉ phép", value: "on_leave" },
  { label: "Đã nghỉ việc", value: "resigned" },
];
