# AeroAPI - Roblox Group Rank Management

Railway API for managing Roblox group ranks with comprehensive validation and error handling.

## Features

- Set ranks for users in Roblox groups
- API key authentication
- Comprehensive error handling and validation
- Rate limiting support
- Moderated account detection

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`

## Environment Variables

- `PORT` - Server port (default: 3000)
- `VALID_API_KEYS` - Comma-separated list of valid API keys

## API Endpoints

### POST /api/setrank

Set a rank for a Roblox user in a group.

#### Headers
```
api-key: your-api-key-here
```

#### Request Body
```json
{
  "roblox-cookie": "your-roblox-cookie",
  "group-id": 123456,
  "rank-id": 255,
  "roblox-username": "targetUsername"
}
```

#### Success Response (200)
```json
{
  "roblox-username": "targetUsername",
  "roblox-id": 123456789,
  "roblox-profile": "https://www.roblox.com/users/123456789/profile",
  "group-id": 123456,
  "rank-id": 255,
  "returnCode": 200
}
```

#### Error Responses

**Invalid/Missing Cookie (400)**
```json
{
  "system": "AeroAPI - Systems",
  "message": "The ROBLOX Cookie set does not exist"
}
```

**Cookie Account Not in Group (403)**
```json
{
  "system": "AeroAPI - Systems",
  "message": "The ROBLOX cookie account given, is not in the ROBLOX group input, thus, we cannot perform actions in the group"
}
```

**Insufficient Permissions (403)**
```json
{
  "system": "AeroAPI - Systems",
  "message": "We were unable to perform rank set actions in the group requested, please check if sufficient permissions were given to the ROBLOX account cookie"
}
```

**Username Not Found (404)**
```json
{
  "system": "AeroAPI - Systems",
  "message": "Our systems have searched far and wide for the username '{username}' and we were unable to find any account associated with that username"
}
```

**API Key Errors (401)**
```json
{
  "system": "AeroAPI - Systems",
  "message": "The API Key you input is ratelimited"
}
```
```json
{
  "system": "AeroAPI - Systems",
  "message": "The API Key you input is no longer valid"
}
```
```json
{
  "system": "AeroAPI - Systems",
  "message": "The API Key you input no longer exists"
}
```
```json
{
  "system": "AeroAPI - Systems",
  "message": "The API Key you input is associated with a moderated account on our database"
}
```

## Running the API

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Deployment to Railway

1. Push your code to a Git repository
2. Connect your repository to Railway
3. Add environment variables in Railway dashboard
4. Deploy

## Security Notes

- Never commit your `.env` file
- Keep your API keys secure
- Roblox cookies should be handled securely and never logged
- Use HTTPS in production

## License

MIT
