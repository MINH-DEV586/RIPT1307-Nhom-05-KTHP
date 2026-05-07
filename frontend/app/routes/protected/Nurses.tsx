import UserManagement from "@/components/users/UserManagement";

export function meta() {
  return [{ title: "Điều dưỡng" }];
}
const Nurses = () => {
  return (
    <UserManagement
      role="nurse"
      title="Điều dưỡng"
      description="Quản lý tài khoản điều dưỡng"
    />
  );
};

export default Nurses;
