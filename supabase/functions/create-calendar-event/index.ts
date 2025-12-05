import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface CalendarEventData {
  studioId: string
  bookingDate: string
  startTime: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  layoutName: string
  notes?: string
  bookingReference: string
  calendarSecretKey: string
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const eventData: CalendarEventData = await req.json()
    const { studioId, calendarSecretKey } = eventData

    // Validate calendar secret key for security
    const expectedSecret = Deno.env.get('CALENDAR_SECRET_KEY')
    if (!expectedSecret || calendarSecretKey !== expectedSecret) {
      throw new Error('Invalid calendar secret key')
    }

    // Initialize Supabase service role client (bypasses RLS)
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // Get studio Google Calendar settings (no user authentication required)
    const { data: studio, error: studioError } = await supabaseService
      .from('studios')
      .select('*')
      .eq('id', studioId)
      .single()

    if (studioError || !studio) {
      throw new Error('Studio not found')
    }

    // Check if Google Calendar integration is enabled
    if (!studio.google_calendar_enabled || !studio.google_refresh_token) {
      console.log('Google Calendar not configured for studio:', studioId)
      return new Response(
        JSON.stringify({ success: true, message: 'Calendar integration not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Create calendar event
    const calendarEvent = await createGoogleCalendarEvent(studio, eventData)

    return new Response(
      JSON.stringify({ success: true, calendarEvent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error creating calendar event:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Function to create Google Calendar event
async function createGoogleCalendarEvent(studio: any, eventData: CalendarEventData) {
  const {
    bookingDate,
    startTime,
    endTime,
    customerName,
    customerEmail,
    customerPhone,
    layoutName,
    notes,
    bookingReference
  } = eventData

  // Log the received values for debugging
  console.log('Calendar event data:', { bookingDate, startTime, endTime, customerName, customerEmail })

  // Validate and parse date/time
  if (!bookingDate || !startTime || !endTime) {
    throw new Error(`Missing date/time values: date=${bookingDate}, start=${startTime}, end=${endTime}`)
  }

  // Ensure time values have seconds if not present (some may come as HH:MM only)
  const startTimeFormatted = startTime.includes(':') && startTime.split(':').length === 3 ? startTime : `${startTime}:00`
  const endTimeFormatted = endTime.includes(':') && endTime.split(':').length === 3 ? endTime : `${endTime}:00`

  // Combine date and time for full datetime
  const startDateTimeStr = `${bookingDate}T${startTimeFormatted}`
  const endDateTimeStr = `${bookingDate}T${endTimeFormatted}`

  console.log('Parsed date/time strings:', { startDateTimeStr, endDateTimeStr })

  const startDateTime = new Date(startDateTimeStr)
  const endDateTime = new Date(endDateTimeStr)

  // Validate that dates are valid
  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    throw new Error(`Invalid date/time values: start=${startDateTimeStr} (${startDateTime.toString()}), end=${endDateTimeStr} (${endDateTime.toString()})`)
  }

  // Convert to Google Calendar format (RFC3339)
  const calendarStartTime = startDateTime.toISOString()
  const calendarEndTime = endDateTime.toISOString()

  // Refresh access token if needed
  let accessToken = studio.google_access_token
  if (!accessToken || new Date(studio.google_token_expires_at) <= new Date()) {
    accessToken = await refreshGoogleToken(studio.google_refresh_token, studio.google_client_id, studio.google_client_secret)

    // Update the studio with new token
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Tokens typically last 1 hour

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseAdmin
      .from('studios')
      .update({
        google_access_token: accessToken,
        google_token_expires_at: expiresAt.toISOString()
      })
      .eq('id', studio.id)
  }

  // Create event object
  const event = {
    summary: `📸 Studio Booking: ${layoutName}`,
    description: `Customer: ${customerName}
Email: ${customerEmail}
${customerPhone ? `Phone: ${customerPhone}\n` : ''}Reference: ${bookingReference}
${notes ? `Notes: ${notes}` : ''}`,
    start: {
      dateTime: calendarStartTime,
      timeZone: 'Asia/Kuala_Lumpur', // Adjust timezone as needed
    },
    end: {
      dateTime: calendarEndTime,
      timeZone: 'Asia/Kuala_Lumpur',
    },
    location: studio.location || 'Studio Location',
    reminders: {
      useDefault: true,
    },
  }

  // Call Google Calendar API
  const calendarId = studio.google_calendar_id || 'primary'
  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  )

  if (!calendarResponse.ok) {
    const errorText = await calendarResponse.text()
    throw new Error(`Google Calendar API error: ${calendarResponse.status} - ${errorText}`)
  }

  const calendarEvent = await calendarResponse.json()
  return calendarEvent
}

// Function to refresh Google OAuth token
async function refreshGoogleToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Google access token')
  }

  const data = await response.json()
  return data.access_token
}
