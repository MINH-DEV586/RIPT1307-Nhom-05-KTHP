import UserManagement from "@/components/users/UserManagement";

export function meta() {
  return [{ title: "Bác sĩ" }];
}
const Doctors = () => {
  return (
    <UserManagement
      role="doctor"
      title="Bác sĩ"
      description="Quản lý tài khoản bác sĩ"
    />
  );
};

export default Doctors;
