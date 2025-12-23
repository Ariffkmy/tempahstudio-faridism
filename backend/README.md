# WhatsApp Service - Baileys Integration

This backend service handles WhatsApp connections using the Baileys library for the RayaStudio WhatsApp Blaster feature.

## Features

- **QR Code Authentication**: Connect WhatsApp via QR code scanning
- **Session Management**: Persistent WhatsApp sessions per studio
- **Contact Syncing**: Import contacts from WhatsApp
- **Message Blasting**: Send bulk personalized messages
- **Rate Limiting**: Built-in delays to prevent WhatsApp bans

## Installation

```bash
cd backend
npm install
```

## Running the Service

### Development Mode

```bash
npm start
```

Or from the root directory:

```bash
npm run whatsapp:service
```

### Run Both Frontend and Backend

From the root directory:

```bash
npm run dev:all
```

This will start both the Vite dev server and the WhatsApp service concurrently.

## API Endpoints

### Connection Management

- `POST /api/whatsapp/connect` - Initiate connection and get QR code
- `GET /api/whatsapp/qr/:studioId` - Get current QR code
- `GET /api/whatsapp/status/:studioId` - Get connection status
- `POST /api/whatsapp/disconnect` - Disconnect device

### Contact Management

- `GET /api/whatsapp/contacts/:studioId` - Get synced contacts

### Message Blasting

- `POST /api/whatsapp/send-blast` - Send bulk messages
- `GET /api/whatsapp/blast-history/:studioId` - Get blast history

### Health Check

- `GET /health` - Service health check

## Environment Variables

Create a `.env` file in the backend directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
WHATSAPP_SERVICE_PORT=3001
```

## Authentication Storage

WhatsApp session data is stored in:
- **File System**: `backend/auth/{studioId}/` - Baileys authentication files
- **Database**: `whatsapp_sessions` table - Session metadata and device info

## Rate Limiting

The service implements a 3-second delay between messages to prevent WhatsApp from flagging the account as spam.

## Troubleshooting

### QR Code Not Generating

1. Ensure the service is running: `npm run whatsapp:service`
2. Check the console for errors
3. Try disconnecting and reconnecting

### Connection Drops

- WhatsApp may disconnect if the phone loses internet
- The service will attempt to reconnect automatically
- Check `whatsapp_sessions` table for connection status

### Messages Not Sending

1. Verify WhatsApp is connected
2. Check phone number format (e.g., +60123456789)
3. Review blast history for error messages

## Security Notes

- Session data contains sensitive authentication information
- Ensure proper RLS policies are in place in Supabase
- Do not commit `.env` files to version control
- Limit access to the backend service (use firewall rules in production)

## Production Deployment

For production:

1. Use a process manager like PM2:
   ```bash
   pm2 start whatsapp-service.js --name whatsapp-service
   ```

2. Set up proper environment variables

3. Configure reverse proxy (nginx) for the service

4. Enable HTTPS

5. Set up monitoring and logging

## Support

For issues related to:
- **Baileys**: https://github.com/WhiskeySockets/Baileys/issues
- **RayaStudio Integration**: Contact your development team
