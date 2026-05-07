import UserManagement from "@/components/users/UserManagement";

export function meta() {
  return [{ title: "Quản trị viên" }];
}
const Admins = () => {
  return (
    <UserManagement
      role="admin"
      title="Quản trị viên"
      description="Quản lý nhân viên quản trị"
    />
  );
};

export default Admins;
