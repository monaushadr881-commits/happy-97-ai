import { createFileRoute } from "@tanstack/react-router";
import { PersonaDashboard } from "@/components/happyx/PersonaDashboard";
import { Clock, ListChecks, Briefcase, Video, FileText, GraduationCap, Wallet, CalendarDays, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employee")({
  head: () => ({ meta: [{ title: "Employee Dashboard — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PersonaDashboard
      persona="Employee"
      subtitle="Attendance, tasks, projects, and everything HR."
      tiles={[
        { icon: Clock, label: "Attendance", desc: "Check-in · Timesheet" },
        { icon: ListChecks, label: "Tasks", desc: "Today · Backlog" },
        { icon: Briefcase, label: "Projects", desc: "Active & assigned" },
        { icon: Video, label: "Meetings", desc: "Calendar & rooms" },
        { icon: FileText, label: "Documents", desc: "Policies · Contracts" },
        { icon: GraduationCap, label: "Training", desc: "Courses & mastery" },
        { icon: Wallet, label: "Salary", desc: "Payslips & reimbursements" },
        { icon: CalendarDays, label: "Leave", desc: "Balance & requests" },
        { icon: Bell, label: "Notifications", desc: "Company-wide" },
      ]}
    />
  ),
});
