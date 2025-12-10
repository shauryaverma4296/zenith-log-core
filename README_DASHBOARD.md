# Winston Logger Dashboard

A web-based dashboard for viewing and searching Winston logs stored in MongoDB.

## Features

- **Log Viewing**: Display logs in a clean, tabular format
- **Search Functionality**: Search by Correlation ID or Transaction ID
- **JSON Formatting**: Pretty-printed JSON for metadata and payload fields
- **Pagination**: Navigate through large log datasets
- **Responsive Design**: Bootstrap-based UI that works on all devices
- **Real-time Updates**: Fresh data on every page load

## Setup

### 1. Environment Variables

Create a `.env` file or set environment variables:

```bash
MONGODB_URL=mongodb://localhost:27017
DB_NAME=winston_logs
COLLECTION_NAME=logs
PORT=3001
```

### 2. Start the Dashboard

```bash
# Start the dashboard server
node src/server.js
```

### 3. Access the Dashboard

Open your browser and navigate to:

- Main Dashboard: `http://localhost:3001`
- Logs View: `http://localhost:3001/logs`
- API Endpoint: `http://localhost:3001/logs/api`

## Usage

### Viewing Logs

The dashboard displays logs in a table with the following columns:

- **Timestamp**: When the log was created
- **Level**: Log level (ERROR, WARN, INFO, DEBUG)
- **Message**: Log message
- **Correlation ID**: Request correlation identifier
- **Transaction ID**: Tibico transaction identifier
- **Metadata**: Additional log metadata (JSON formatted)
- **Payload**: Request/response payload (JSON formatted)

### Searching Logs

1. **Toggle Search Type**: Choose between "Correlation ID" or "Transaction ID"
2. **Enter Search Term**: Type the ID you want to search for
3. **Submit**: Click "Search" or press Enter

The search supports partial matches and is case-insensitive.

### Pagination

- Navigate through pages using the pagination controls at the bottom
- Default: 50 logs per page
- Customize with `?limit=100` query parameter

## API Usage

### GET /logs/api

Returns logs in JSON format with the same search and pagination features.

**Query Parameters:**

- `search`: Search term
- `type`: Search type (`correlationId` or `tibcotransactionid`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Example:**

```bash
curl "http://localhost:3001/logs/api?search=abc123&type=correlationId&page=1&limit=25"
```

**Response:**

```json
{
  "logs": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 123,
    "itemsPerPage": 25
  },
  "search": {
    "query": "abc123",
    "type": "correlationId"
  }
}
```

## MongoDB Document Structure

The dashboard expects logs in this format:

```json
{
  "_id": "...",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "Request processed",
  "meta": {
    "correlationId": "req_abc123",
    "tibcotransactionid": "txn_xyz789",
    "payload": {
      "userId": "user123",
      "action": "create_order"
    },
    "requestId": "...",
    "responseTime": 150
  }
}
```

## Integration with Winston Logger

To use this dashboard with your Winston logger, ensure your MongoDB transport is configured:

```javascript
const { initializeLogger } = require('winston_express_logger');

const logger = initializeLogger({
  level: 'info',
  transports: [
    {
      type: 'console',
    },
    {
      type: 'mongodb',
      connectionString: 'mongodb://localhost:27017',
      database: 'winston_logs',
      collection: 'logs',
    },
  ],
});
```

## Development

### File Structure

```
views/
  ├── layout.pug          # Base template
  └── logs.pug           # Logs page template

src/
  ├── routes/
  │   └── logs.js        # Logs routes and MongoDB logic
  └── server.js          # Express server setup
```

### Customization

- **Styling**: Edit the CSS in `views/layout.pug`
- **Layout**: Modify `views/logs.pug` for table structure
- **Search Logic**: Update `src/routes/logs.js` for custom search fields
- **Pagination**: Adjust default page size in routes

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**

   - Check MONGODB_URL environment variable
   - Ensure MongoDB is running
   - Verify database and collection names

2. **No Logs Displayed**

   - Confirm logs are being written to MongoDB
   - Check collection name matches COLLECTION_NAME
   - Verify log document structure

3. **Search Not Working**
   - Ensure correlation/transaction IDs are stored in `meta` object
   - Check field names match your log structure

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=winston-dashboard node src/server.js
```
