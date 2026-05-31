import type { APIRoute } from 'astro';
import { generateGenericICS } from '../../../lib/calendarGenerator';

export const prerender = false;

/**
 * Generate generic ICS calendar file for the party
 * Route: /api/calendar/party.ics
 *
 * Features:
 * - Generic party calendar event (no personalization)
 * - RFC 5545 compliant ICS format
 * - Dual reminders: 1 week (email) + 1 day (popup)
 * - Cross-platform compatibility (Google, Outlook 2026, Apple)
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Generate generic ICS content
    const icsContent = generateGenericICS();

    // Return ICS file with proper headers
    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="alina-birthday-party.ics"',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour since content is static
        'Pragma': 'public'
      }
    });

  } catch (error) {
    console.error('Error generating generic calendar:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};