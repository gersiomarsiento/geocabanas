// app/admin/page.tsx

import AdminAvailabilityCalendar from "@/app/components/AdminAvailabilityCalendar";

export default function AdminHome() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Disponibilidad y precios</h1>
      <AdminAvailabilityCalendar />
    </div>
  );
}
