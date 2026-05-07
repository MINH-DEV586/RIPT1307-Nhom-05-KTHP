import { Outlet } from "react-router";

export default function LabLayout() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <Outlet />
    </div>
  );
}
