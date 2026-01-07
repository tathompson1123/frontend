import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  Globe,
  MapPin,
  Briefcase,
  Users,
  Clock,
  TrendingUp,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

// Component imports
import Overview from '../components/dashboard/Overview';
import BookingCalendar from '../components/dashboard/BookingCalendar';
import MyWebsite from '../components/dashboard/MyWebsite';
import GoogleBusiness from '../components/dashboard/GoogleBusiness';
import Services from '../components/dashboard/Services';
import Team from '../components/dashboard/Team';
import BusinessInformation from '../components/dashboard/BusinessInformation';
import Analytics from '../components/dashboard/Analytics';
import Billing from '../components/dashboard/Billing';
import SettingsPage from '../components/dashboard/Settings';

// Helper function for authenticated API calls
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token')
