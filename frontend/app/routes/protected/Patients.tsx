import UserManagement from "@/components/users/UserManagement";

export function meta() {
  return [{ title: "Bệnh nhân" }];
}
const Patients = () => {
  return (
    <UserManagement
      role="patient"
      title="Bệnh nhân"
      description="Quản lý hồ sơ bệnh nhân"
    />
  );
};

export default Patients;
