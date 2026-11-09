/**
 * Projects data for sarim-portfolio-mcp.
 *
 * This file is the ONLY place the projects list lives, so the list can
 * be changed in one edit without touching the server logic.
 *
 * STATUS (9 Nov 2026): CONFIRMED by the user — keep ONLY the three
 * projects below. No other projects are included.
 */

export type Project = {
  id: string;
  name: string;
  description: string;
  /** Publication / availability status. Must be stated truthfully;
   *  never claim an app is live on Play Store when it is not. */
  status?: string;
  links: Record<string, string>;
};

// User-confirmed 9 Nov 2026: exactly these three projects, nothing else.
export const PROJECTS: Project[] = [
  {
    id: "core-x",
    name: "Core X App and Admin Panel",
    description:
      "Personal training platform for class/session bookings, member orders and administration; booking, cancellation and refund workflows for member app and admin portal; Apple/Google login, Firebase users, FCM alerts, SMTP email and OTP delivery; refund and photo-evidence workflows validated with 36 passing automated tests.",
    links: { site: "https://simple-landing-page-gym.vercel.app/" },
  },
  {
    id: "webnexai",
    name: "WebNexAI",
    description:
      "Web & Mobile Application Development, AI Solutions, Cloud Application Development, UI/UX Design.",
    links: { site: "https://webnexai.vercel.app/" },
  },
  {
    id: "bitecraft",
    name: "BiteCraft",
    description:
      "Full-stack e-commerce platform for a premium organic snacks store (Aug–Sep 2026); product listings, bestseller sections, discount offers and a checkout-ready browsing flow.",
    links: { site: "https://snack-store-six.vercel.app/" },
  },
];
