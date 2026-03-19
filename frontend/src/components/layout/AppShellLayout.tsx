import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PaymentsIcon from '@mui/icons-material/Payments';
import QuizIcon from '@mui/icons-material/Quiz';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { AppShell } from './AppShell';
import { Breadcrumb } from './Breadcrumb';
import type { NavItem } from '../../types/domain';
import { ROUTES } from '../../router/routes';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: ROUTES.DASHBOARD, roles: ['admin', 'teacher'] },
  { label: 'Students', icon: <PeopleIcon />, path: ROUTES.STUDENTS, roles: ['admin', 'teacher'] },
  { label: 'Attendance', icon: <EventNoteIcon />, path: ROUTES.ATTENDANCE, roles: ['admin', 'teacher'] },
  { label: 'Fees', icon: <PaymentsIcon />, path: ROUTES.FEES_STRUCTURES, roles: ['admin'] },
  { label: 'Exams', icon: <QuizIcon />, path: ROUTES.EXAMS, roles: ['admin', 'teacher'] },
  { label: 'Timetable', icon: <CalendarMonthIcon />, path: ROUTES.TIMETABLE, roles: ['admin', 'teacher'] },
];

/**
 * Layout wrapper that provides AppShell + Outlet for nested routes.
 */
export function AppShellLayout() {
  return (
    <AppShell navItems={NAV_ITEMS}>
      <Breadcrumb />
      <Outlet />
    </AppShell>
  );
}
