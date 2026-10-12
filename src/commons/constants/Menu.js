import { LogoutButton } from "@/components/elements/LogoutButton";
import { ThemeSwitch } from "@/components/elements/ThemeSwitch";
import {
  Analytics01Icon,
  CalendarCheckIn01Icon,
  CalendarClockIcon,
  CalendarSyncIcon,
  Home07Icon,
  KeyframesDoubleAddIcon,
  MapsLocation01Icon,
  PackageAddIcon,
} from "@hugeicons/core-free-icons";

export const NAVIGATION_MENU = [
  {
    groupLabel: "Workspace",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: Home07Icon,
        title: "Overview",
        isShow: true,
        type: "Pages",
      },
      {
        label: "Action Dates",
        href: "/dashboard/action-dates",
        icon: CalendarSyncIcon,
        title: "Action Dates",
        isShow: true,
        type: "Pages",
      },
      {
        label: "Created Dates",
        href: "/dashboard/created-dates",
        icon: PackageAddIcon,
        title: "Created Dates",
        isShow: true,
        type: "Pages",
      },
      {
        label: "Monitoring",
        href: "/dashboard/engineer-monitoring",
        icon: Analytics01Icon,
        title: "Monitoring",
        isShow: true,
        type: "Pages",
      },
    ],
  },
  {
    groupLabel: "Mandatory Workspace",
    items: [
      {
        label: "Allocation",
        href: "/dashboard/allocation",
        icon: MapsLocation01Icon,
        title: "Allocation",
        isShow: true,
        type: "Pages",
      },
      {
        label: "Appointment",
        href: "/dashboard/appointment",
        icon: CalendarClockIcon,
        title: "Appointment",
        isShow: true,
        type: "Pages",
      },
      {
        label: "Conflict",
        href: "/dashboard/conflict",
        icon: CalendarCheckIn01Icon,
        title: "Conflict",
        isShow: true,
        type: "Pages",
      },
      {
        label: "Aging",
        href: "/dashboard/aging",
        icon: KeyframesDoubleAddIcon,
        title: "Aging",
        isShow: true,
        type: "Pages",
      },
    ],
  },
  // {
  //   groupLabel: "Dangerous Workspace",
  //   items: [
  //     {
  //       label: "Break Contract",
  //       href: "/dashboard/dangerous/break-contract",
  //       icon: SignatureIcon,
  //       title: "Break Contract",
  //       isShow: true,
  //       type: "Pages",
  //     },
  //   ],
  // },
  // {
  //   groupLabel: "Monitoring Workspace",
  //   items: [
  //     {
  //       label: "Assigned Yesterday",
  //       href: "/dashboard/monitoring/assigned-yesterday",
  //       icon: LayoutDashboardIcon,
  //       title: "Assigned Yesterday",
  //       isShow: true,
  //       type: "Pages",
  //     },
  //   ],
  // },
  {
    groupLabel: "Settings",
    items: [
      {
        label: "Dark Mode",
        isShow: true,
        type: "Component",
        component: ThemeSwitch,
      },
      {
        label: "Logout",
        isShow: true,
        type: "Component",
        component: LogoutButton,
      },
    ],
  },
  // {
  //   groupLabel: "Settings",
  //   items: [
  //     {
  //       label: "Logout",
  //       isShow: true,
  //       type: "Component",
  //       component: LogoutButton,
  //     },
  //   ],
  // },
];
