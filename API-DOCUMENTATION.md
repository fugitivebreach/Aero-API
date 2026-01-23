# AeroAPI - Professional API Documentation

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Base URL:** `https://your-domain.up.railway.app`

---

## TABLE OF CONTENTS

1. [API Requirements](#api-requirements)
2. [API Links & Endpoints](#api-links--endpoints)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [Endpoint Specifications](#endpoint-specifications)
7. [Response Codes](#response-codes)
8. [Support & Contact](#support--contact)

---

## API REQUIREMENTS

### **Technical Requirements**

| Requirement | Specification |
|------------|---------------|
| **Protocol** | HTTPS (TLS 1.2+) |
| **Content Type** | `application/json` |
| **Authentication** | API Key (Header-based) |
| **Character Encoding** | UTF-8 |
| **Request Method** | POST |
| **Timeout** | 30 seconds |
| **Max Request Size** | 10 MB |

### **API Key Requirements**

- **Acquisition:** API keys must be obtained through the AeroAPI Dashboard
- **Authentication Method:** Include API key in request headers
- **Key Format:** `AeroAPI-[UUID]` (e.g., `AeroAPI-a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- **Security:** Keys are unique per user and should be kept confidential
- **Validity:** Keys remain valid until manually revoked by user or administrator
- **Moderation:** Keys may be temporarily or permanently disabled for policy violations

### **Roblox Cookie Requirements**

- **Format:** Valid `.ROBLOSECURITY` cookie
- **Permissions:** Cookie must have permission to manage the target group
- **Rank Authority:** Cookie owner must have sufficient rank to promote/demote target users
- **Validity:** Cookie must be active and not expired
- **Security:** Cookies should be stored securely and transmitted only via HTTPS

### **Request Requirements**

All API requests must include:

1. **Valid API Key** - Provided in request headers
2. **Roblox Cookie** - Included in request body
3. **Group ID** - Valid Roblox group identifier
4. **Rank ID** - Target rank within the specified group
5. **Target Username** - Valid Roblox username to be ranked

### **System Requirements for Integration**

- **Programming Language:** Any language with HTTP/HTTPS support
- **JSON Parser:** Ability to parse JSON responses
- **Error Handling:** Implementation of retry logic for transient failures
- **Logging:** Recommended for tracking API usage and debugging
- **Security:** Secure storage of API keys and Roblox cookies

---

## API LINKS & ENDPOINTS

### **Base URL**
```
https://your-domain.up.railway.app
```

### **Primary Endpoints**

#### **1. Roblox Rank Management**
```
POST /api/setrank
```
**Purpose:** Set a user's rank in a Roblox group  
**Authentication:** Required (API Key)  
**Rate Limit:** Standard

---

#### **2. API Key Validation**
```
GET /api/validate-key/:apiKey
```
**Purpose:** Validate an API key and check its status  
**Authentication:** None (Public)  
**Rate Limit:** High

---

#### **3. User API Key Management**

##### Generate New API Key
```
POST /api/user/keys/generate
```
**Purpose:** Generate a new API key for authenticated user  
**Authentication:** Required (Session)  
**Rate Limit:** 10 keys per user

##### List User API Keys
```
GET /api/user/keys
```
**Purpose:** Retrieve all API keys for authenticated user  
**Authentication:** Required (Session)  
**Rate Limit:** Standard

##### Delete API Key
```
DELETE /api/user/keys/:id
```
**Purpose:** Delete a specific API key  
**Authentication:** Required (Session)  
**Rate Limit:** Standard

---

#### **4. Admin Endpoints**

##### List All Users
```
GET /api/admin/users?search=query
```
**Purpose:** Retrieve all users with optional search  
**Authentication:** Required (Admin Session)  
**Rate Limit:** Standard

##### Moderate User
```
POST /api/admin/moderate
```
**Purpose:** Apply moderation action to a user  
**Authentication:** Required (Admin Session)  
**Rate Limit:** Standard

##### Remove Moderation
```
POST /api/admin/unmoderate
```
**Purpose:** Remove moderation from a user  
**Authentication:** Required (Admin Session)  
**Rate Limit:** Standard

##### Get Moderation History
```
GET /api/admin/moderation-history/:userId
```
**Purpose:** Retrieve moderation history for a specific user  
**Authentication:** Required (Admin Session)  
**Rate Limit:** Standard

---

#### **5. Authentication Endpoints**

##### Discord OAuth2 Login
```
GET /auth/discord
```
**Purpose:** Initiate Discord OAuth2 authentication flow  
**Authentication:** None  
**Rate Limit:** Standard

##### OAuth2 Callback
```
GET /auth/discord/callback
```
**Purpose:** Handle Discord OAuth2 callback  
**Authentication:** None (Internal)  
**Rate Limit:** Standard

##### Logout
```
GET /logout
```
**Purpose:** End user session  
**Authentication:** Required (Session)  
**Rate Limit:** Standard

---

#### **6. Web Interface Endpoints**

##### Landing Page
```
GET /
```
**Purpose:** Display landing page or redirect to dashboard if authenticated

##### User Dashboard
```
GET /dashboard
```
**Purpose:** Display user dashboard with API key management  
**Authentication:** Required (Session)

##### Admin Panel
```
GET /admin
```
**Purpose:** Display admin panel for user moderation  
**Authentication:** Required (Admin Session)

---

## AUTHENTICATION

### **API Key Authentication**

**Header Format:**
```http
api-key: AeroAPI-your-api-key-here
```

**Example Request:**
```bash
curl -X POST https://your-domain.up.railway.app/api/setrank \
  -H "Content-Type: application/json" \
  -H "api-key: AeroAPI-a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -d '{
    "roblox-cookie": "your-roblox-cookie",
    "group-id": 123456,
    "rank-id": 255,
    "roblox-username": "targetUser"
  }'
```

### **Session Authentication**

Used for dashboard and admin panel access. Managed automatically through Discord OAuth2.

**Session Duration:** 7 days  
**Storage:** Secure HTTP-only cookies  
**Renewal:** Automatic on activity

---

## RATE LIMITING

### **Rate Limit Tiers**

| Tier | Requests per Minute | Applies To |
|------|---------------------|------------|
| **Standard** | 60 | Most endpoints |
| **High** | 120 | Validation endpoints |
| **Restricted** | 10 | Key generation |

### **Rate Limit Headers**

Response headers include rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

### **Rate Limit Exceeded Response**

**Status Code:** `429 Too Many Requests`

```json
{
  "valid": false,
  "message": "The API Key you input is ratelimited"
}
```

---

## ERROR HANDLING

### **Error Response Format**

All errors follow a consistent JSON structure:

```json
{
  "valid": false,
  "message": "Error description here"
}
```

### **Common Error Messages**

| Message | Cause | Resolution |
|---------|-------|------------|
| `The API Key you input no longer exists` | Invalid or deleted API key | Generate a new API key |
| `The API Key you input is associated with a moderated account on our database` | Account is locked | Contact administrator |
| `The API Key you input is no longer valid` | Account is disabled | Contact administrator |
| `The API Key you input is ratelimited` | Rate limit exceeded | Wait before retrying |
| `The Roblox cookie you input is invalid` | Invalid or expired cookie | Update Roblox cookie |
| `You do not have permission to manage this group` | Insufficient permissions | Use account with group permissions |
| `You do not have permission to set users to this rank` | Rank too high | Use lower rank or higher authority account |
| `The username you input does not exist` | Invalid Roblox username | Verify username spelling |

---

## ENDPOINT SPECIFICATIONS

### **POST /api/setrank**

Set a user's rank in a Roblox group.

#### **Request Headers**

```http
Content-Type: application/json
api-key: AeroAPI-your-api-key-here
```

#### **Request Body**

```json
{
  "roblox-cookie": "string (required)",
  "group-id": "number (required)",
  "rank-id": "number (required)",
  "roblox-username": "string (required)"
}
```

#### **Request Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `roblox-cookie` | string | Yes | Valid .ROBLOSECURITY cookie |
| `group-id` | number | Yes | Roblox group ID |
| `rank-id` | number | Yes | Target rank ID (0-255) |
| `roblox-username` | string | Yes | Target Roblox username |

#### **Success Response (200 OK)**

```json
{
  "roblox-username": "targetUser",
  "roblox-id": 123456789,
  "roblox-profile": "https://www.roblox.com/users/123456789/profile",
  "group-id": 123456,
  "rank-id": 255,
  "returnCode": 200
}
```

#### **Error Responses**

**400 Bad Request** - Invalid cookie or missing fields
```json
{
  "valid": false,
  "message": "The Roblox cookie you input is invalid"
}
```

**401 Unauthorized** - Invalid API key
```json
{
  "valid": false,
  "message": "The API Key you input no longer exists"
}
```

**403 Forbidden** - Insufficient permissions or moderated account
```json
{
  "valid": false,
  "message": "You do not have permission to manage this group"
}
```

**404 Not Found** - Username doesn't exist
```json
{
  "valid": false,
  "message": "The username you input does not exist"
}
```

**429 Too Many Requests** - Rate limited
```json
{
  "valid": false,
  "message": "The API Key you input is ratelimited"
}
```

---

### **GET /api/validate-key/:apiKey**

Validate an API key and retrieve its status.

#### **URL Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | API key to validate |

#### **Success Response (200 OK)**

```json
{
  "valid": true,
  "user": {
    "discord_username": "username#0000",
    "discord_id": "123456789012345678"
  }
}
```

#### **Error Responses**

**404 Not Found** - Key doesn't exist
```json
{
  "valid": false,
  "message": "The API Key you input no longer exists"
}
```

**403 Forbidden** - Account moderated
```json
{
  "valid": false,
  "message": "The API Key you input is associated with a moderated account on our database"
}
```

---

### **POST /api/user/keys/generate**

Generate a new API key for the authenticated user.

#### **Authentication**

Requires active Discord OAuth2 session.

#### **Request Body**

```json
{
  "name": "string (optional)"
}
```

#### **Success Response (200 OK)**

```json
{
  "success": true,
  "apiKey": {
    "id": "uuid",
    "key": "AeroAPI-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Default",
    "created_at": "2026-01-23T10:00:00.000Z",
    "last_used": null
  }
}
```

#### **Error Response (403 Forbidden)**

```json
{
  "error": "Account is moderated",
  "moderationStatus": {
    "isLocked": true,
    "isDisabled": false,
    "isRatelimited": false
  }
}
```

---

### **POST /api/admin/moderate**

Apply moderation action to a user account.

#### **Authentication**

Requires admin session.

#### **Request Body**

```json
{
  "userId": "number (required)",
  "actionType": "string (required)",
  "reason": "string (required)",
  "durationSeconds": "number (optional)"
}
```

#### **Action Types**

- `lock` - Completely blocks account access
- `disable` - Disables account functionality
- `ratelimit` - Temporary restriction with custom duration

#### **Success Response (200 OK)**

```json
{
  "success": true
}
```

#### **Error Response (400 Bad Request)**

```json
{
  "error": "Missing required fields"
}
```

---

## RESPONSE CODES

### **HTTP Status Codes**

| Code | Status | Description |
|------|--------|-------------|
| **200** | OK | Request successful |
| **400** | Bad Request | Invalid request parameters |
| **401** | Unauthorized | Invalid or missing API key |
| **403** | Forbidden | Insufficient permissions or account moderated |
| **404** | Not Found | Resource not found |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server-side error |

### **Custom Return Codes**

The `/api/setrank` endpoint includes a `returnCode` field in successful responses:

| Return Code | Meaning |
|-------------|---------|
| **200** | Rank successfully updated |

---

## SUPPORT & CONTACT

### **Technical Support**

For API-related issues, please contact:

- **Email:** support@your-domain.com
- **Discord:** Join our support server
- **Documentation:** https://your-domain.up.railway.app/docs

### **Status Page**

Monitor API status and uptime:
- **URL:** https://status.your-domain.com

### **Rate Limit Increases**

For enterprise usage requiring higher rate limits, contact our sales team.

### **Security Issues**

Report security vulnerabilities to: security@your-domain.com

---

## CHANGELOG

### Version 1.0.0 (January 2026)
- Initial API release
- Roblox rank management endpoint
- Discord OAuth2 integration
- User dashboard and API key management
- Admin moderation system
- Rate limiting implementation

---

**© 2026 AeroAPI. All rights reserved.**

*This documentation is subject to change. Please check for updates regularly.*
