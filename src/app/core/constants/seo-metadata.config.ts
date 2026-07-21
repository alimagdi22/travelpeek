import { SeoConfig } from '../services/seo.service';

/**
 * Centralized Static SEO Metadata Configuration
 * Add static titles, descriptions, keywords, and OpenGraph values for each route here.
 */
export const SEO_METADATA: Record<string, SeoConfig> = {
  home: {
    title: 'Travelpeek - Discover & Book Your Next Trip',
    description: 'Explore hand-picked destinations, flights, and unforgettable travel experiences with Travelpeek.',
    keywords: 'travel, flight booking, destinations, travelpeek, flights',
    ogTitle: 'Travelpeek - Discover & Book Your Next Trip',
    ogDescription: 'home Explore hand-picked destinations, flights, and unforgettable travel experiences with Travelpeek.',
    ogImage: 'assets/images/og-home.jpg',
  },
  support: {
    title: 'Support & Help Center - Travelpeek',
    description: 'support Get help with your bookings, account settings, and travel inquiries on Travelpeek.',
    keywords: 'support, help center, travelpeek help, customer service',
    ogTitle: 'Support & Help Center - Travelpeek',
    ogDescription: 'support Get help with your bookings, account settings, and travel inquiries on Travelpeek.',
  },
  legal: {
    title: 'Terms & Conditions & Privacy Policy - Travelpeek',
    description: 'legal Read the terms of service, privacy policy, and legal agreements for Travelpeek.',
    ogTitle: 'Terms & Conditions & Privacy Policy - Travelpeek',
    ogDescription: 'legal Read the terms of service, privacy policy, and legal agreements for Travelpeek.',
  },
  myTrips: {
    title: 'My Trips - Travelpeek',
    description: 'my-trips View and manage your booked trips and itineraries on Travelpeek.',
    ogTitle: 'My Trips - Travelpeek',
    ogDescription: 'my-trips View and manage your booked trips and itineraries on Travelpeek.',
  },
  login: {
    title: 'Sign In - Travelpeek',
    description: 'login Log in to your Travelpeek account to view your bookings and saved preferences.',
    ogTitle: 'Sign In - Travelpeek',
    ogDescription: 'login Log in to your Travelpeek account to view your bookings and saved preferences.',
  },
  userManagement: {
    title: 'Account Settings - Travelpeek',
    description: 'user-management Manage your profile details and account preferences.',
    ogTitle: 'Account Settings - Travelpeek',
    ogDescription: 'user-management Manage your profile details and account preferences.',
  },
};
