import { AppointmentModules } from "@/modules/appointment";

export const metadata = { title: "Appointment Dates" };

export default function AppointmentDatesPage({ user }) {
  return (
    <>
      <AppointmentModules user={user} />
    </>
  );
}
