import { LogoutButton } from "@/components/elements/LogoutButton";
import { ThemeSwitch } from "@/components/elements/ThemeSwitch";
import {
  CalendarCheckIn01Icon,
  Clock01Icon,
  Home07Icon,
  KeyframesDoubleAddIcon,
  MapsLocation01Icon,
  PropertyAddIcon,
  TransactionHistoryIcon,
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
        icon: TransactionHistoryIcon,
        title: "Action Dates",
        isShow: true,
        type: "Pages",
      },
      {
        label: "Created Dates",
        href: "/dashboard/created-dates",
        icon: PropertyAddIcon,
        title: "Created Dates",
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
        icon: Clock01Icon,
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
];
