import type { APIRoute } from 'astro';
import pool from '../../../lib/db';
import { generatePersonalizedICS } from '../../../lib/calendarGenerator';

export const prerender = false;

/**
 * Generate personalized ICS calendar file for RSVP guests
 * Route: /api/calendar/[rsvpId].ics
 *
 * Features:
 * - Personalized calendar event with guest name
 * - RFC 5545 compliant ICS format
 * - Dual reminders: 1 week (email) + 1 day (popup)
 * - Cross-platform compatibility (Google, Outlook 2026, Apple)
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const rsvpId = params.rsvpId;

    if (!rsvpId) {
      return new Response('RSVP ID is required', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Look up the RSVP record to get guest name
    // We'll use the ID from the database to personalize the calendar
    const { rows } = await pool.query(
      'SELECT id, name, attending FROM rsvps WHERE id = $1',
      [rsvpId]
    );

    if (rows.length === 0) {
      return new Response('RSVP not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const rsvp = rows[0];

    // Only generate calendar for guests who are attending
    if (rsvp.attending !== 'yes') {
      return new Response('Calendar is only available for guests who are attending', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Generate personalized ICS content
    const icsContent = generatePersonalizedICS(rsvp.name, rsvpId);

    // Return ICS file with proper headers
    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="alina-birthday-party-${rsvp.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error generating calendar:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};