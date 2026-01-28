# Lichess OAuth Setup Guide

Complete guide for implementing Lichess OAuth authentication in your Chess Trainer application.

---

## Why Lichess OAuth is Great

Lichess has a **much simpler** OAuth setup than most providers - **no app registration required**! You can implement OAuth without creating a developer account or registering your application.

### Key Benefits

- ✅ No app registration needed
- ✅ No client secret required (public client)
- ✅ Uses PKCE (Proof Key for Code Exchange) for security
- ✅ Works with any redirect URI (no pre-registration)
- ✅ Simple scope-based permissions

**Official Documentation:** https://github.com/lichess-org/api/blob/master/example/README.md

---

## OAuth Flow Overview

```
User clicks "Login with Lichess"
    ↓
Redirect to: https://lichess.org/oauth
    ↓
User authorizes your app on Lichess
    ↓
Lichess redirects back to: https://your-domain.com/api/auth/lichess/callback?code=...
    ↓
Your backend exchanges code for access token
    ↓
Use token to fetch user info from: https://lichess.org/api/account
    ↓
User logged in!
```

---

## Step-by-Step Setup

### Step 1: Understand Lichess OAuth Endpoints

Lichess provides these OAuth 2.0 endpoints:

| Endpoint | URL | Purpose |
|----------|-----|---------|
| **Authorization** | `https://lichess.org/oauth` | User grants permission |
| **Token Exchange** | `https://lichess.org/api/token` | Exchange code for token |
| **User Info** | `https://lichess.org/api/account` | Get logged-in user data |

### Step 2: Choose Your Client ID

Unlike most OAuth providers, Lichess **doesn't require app registration**. You can use **any string** as your client ID.

**Recommended format:** Use your app's domain or a descriptive name

Examples:
```bash
# For local development
LICHESS_CLIENT_ID=chess-trainer-localhost

# For production
LICHESS_CLIENT_ID=chess-trainer-app
# or
LICHESS_CLIENT_ID=yourdomain.com
```

### Step 3: Configure Environment Variables

Add these to your `.env` file (both local and production):

**Local Development:**
```bash
# Lichess OAuth (Local)
LICHESS_CLIENT_ID=chess-trainer-localhost
LICHESS_REDIRECT_URI=http://localhost:3009/api/auth/lichess/callback
```

**Production (Mikr.us):**
```bash
# Lichess OAuth (Production)
LICHESS_CLIENT_ID=chess-trainer-app
LICHESS_REDIRECT_URI=http://srv37.mikr.us:30191/api/auth/lichess/callback
# or with custom domain:
# LICHESS_REDIRECT_URI=https://your-domain.com/api/auth/lichess/callback
```

### Step 4: Request Appropriate Scopes

Choose scopes based on what data you need:

| Scope | Description | Needed for Chess Trainer? |
|-------|-------------|---------------------------|
| `email:read` | Read user's email address | ✅ **Yes** (for user identification) |
| `preference:read` | Read user preferences | ❌ Optional |
| `challenge:read` | Read incoming challenges | ❌ No (not used) |
| `challenge:write` | Create/accept challenges | ❌ No (not used) |
| `tournament:write` | Create tournaments | ❌ No (not used) |

**Recommended for Chess Trainer:**
```typescript
scope: ['email:read']
```

### Step 5: Implement OAuth in NestJS Backend

Your `backend/src/modules/auth/strategies/lichess.strategy.ts` should look like this:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LichessStrategy extends PassportStrategy(Strategy, 'lichess') {
  constructor(private configService: ConfigService) {
    super({
      authorizationURL: 'https://lichess.org/oauth',
      tokenURL: 'https://lichess.org/api/token',
      clientID: configService.get('LICHESS_CLIENT_ID'),
      // NOTE: Lichess doesn't use client secret (public client)
      clientSecret: 'not_required',
      callbackURL: configService.get('LICHESS_REDIRECT_URI'),
      scope: ['email:read'],
      // IMPORTANT: Lichess uses PKCE
      pkce: true,
      state: true,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // Fetch user data from Lichess
    const response = await fetch('https://lichess.org/api/account', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const lichessUser = await response.json();

    return {
      lichessId: lichessUser.id,
      username: lichessUser.username,
      email: lichessUser.email,
      displayName: lichessUser.username,
      provider: 'lichess',
    };
  }
}
```

### Step 6: Test Locally

1. **Start your backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Visit the OAuth URL in your browser:**
   ```
   http://localhost:3009/api/auth/lichess
   ```

3. **Expected flow:**
   - Redirects to Lichess login page
   - You log in with your Lichess account
   - Lichess shows permission request: "Chess Trainer wants to access your email"
   - Click "Authorize"
   - Redirects back to: `http://localhost:3009/api/auth/lichess/callback?code=...`
   - Your backend exchanges code for token
   - User logged in!

4. **Debugging tips:**
   ```bash
   # Check backend logs for errors
   # Look for "Lichess OAuth" in terminal

   # Common issues:
   # - Redirect URI mismatch (check .env matches actual URL)
   # - CORS errors (check CORS_ORIGINS includes frontend URL)
   # - Missing scopes (verify scope includes 'email:read')
   ```

### Step 7: Update Production Configuration

When deploying to production:

1. **Update `.env` on server:**
   ```bash
   ssh <username>@srv37.mikr.us
   cd /var/www/chess-trainer
   nano .env
   ```

2. **Set production redirect URI:**
   ```bash
   LICHESS_CLIENT_ID=chess-trainer-app
   LICHESS_REDIRECT_URI=http://srv37.mikr.us:30191/api/auth/lichess/callback
   ```

3. **No additional configuration needed!**
   - Unlike Google OAuth, you don't need to update any settings on Lichess's side
   - The redirect URI can be any valid URL
   - No allowlist or app approval required

### Step 8: Handle User Data

After successful OAuth, you'll receive this data from Lichess:

```json
{
  "id": "lichess-user-id",
  "username": "PlayerName",
  "email": "player@example.com",
  "createdAt": 1290415680000,
  "seenAt": 1290415680000,
  "perfs": {
    "blitz": { "rating": 1500, "games": 123 },
    "rapid": { "rating": 1600, "games": 456 }
  },
  "count": {
    "all": 579,
    "rated": 500,
    "win": 290,
    "loss": 200,
    "draw": 89
  }
}
```

**What to save in your database:**
```typescript
{
  lichessId: lichessUser.id,          // Unique Lichess user ID
  username: lichessUser.username,      // Display name
  email: lichessUser.email,            // Email (if scope granted)
  provider: 'lichess',                 // OAuth provider
  // Optional: save rating for puzzle recommendations
  blitzRating: lichessUser.perfs?.blitz?.rating,
}
```

---

## Important Notes

### PKCE (Proof Key for Code Exchange)

Lichess **requires** PKCE for security. Your OAuth library should handle this automatically.

**What is PKCE?**
- Extra security layer for public clients (no client secret)
- Prevents authorization code interception attacks
- Automatically handled by `passport-oauth2` when `pkce: true`

### No Client Secret Required

Unlike Google OAuth:
- ❌ No client secret to keep secure
- ❌ No risk of secret exposure
- ✅ Safe to use in mobile/desktop apps
- ✅ Simpler configuration

### Redirect URI Flexibility

Lichess **doesn't require** pre-registering redirect URIs:
- ✅ Can change URLs without updating app settings
- ✅ Works with localhost, staging, and production
- ✅ No need to manage multiple OAuth apps for different environments

**However**, your backend **must validate** the redirect URI matches your configured `LICHESS_REDIRECT_URI` for security.

---

## Troubleshooting

### Error: "Invalid redirect_uri"

**Cause:** Redirect URI in OAuth request doesn't match your `.env`

**Solution:**
```bash
# Check that LICHESS_REDIRECT_URI in .env matches exactly
# Including protocol (http/https), domain, port, and path

# Local example:
LICHESS_REDIRECT_URI=http://localhost:3009/api/auth/lichess/callback

# Production example:
LICHESS_REDIRECT_URI=http://srv37.mikr.us:30191/api/auth/lichess/callback
```

### Error: "Access denied" or "User cancelled"

**Cause:** User clicked "Cancel" on Lichess authorization screen

**Solution:**
- Show friendly error message: "Login cancelled. Please try again."
- Redirect user back to login page

### Error: "Invalid token"

**Cause:** Token exchange failed or token expired

**Solution:**
```bash
# Check token endpoint URL is correct
# Should be: https://lichess.org/api/token (not /oauth/token)

# Verify you're sending:
# - grant_type=authorization_code
# - code=<authorization_code>
# - redirect_uri=<same as authorization>
# - client_id=<your client id>
```

### Error: "403 Forbidden" when fetching user data

**Cause:** Missing or invalid access token

**Solution:**
```bash
# Ensure you're sending Authorization header:
Authorization: Bearer <access_token>

# Check token was successfully received from token exchange
```

---

## Example: Complete OAuth Flow

**1. User clicks "Login with Lichess"**

Frontend redirects to:
```
http://localhost:3009/api/auth/lichess
```

**2. Backend redirects to Lichess**

```
https://lichess.org/oauth?
  response_type=code&
  client_id=chess-trainer-localhost&
  redirect_uri=http://localhost:3009/api/auth/lichess/callback&
  scope=email:read&
  code_challenge=<generated_pkce_challenge>&
  code_challenge_method=S256&
  state=<random_state>
```

**3. User authorizes on Lichess**

Lichess redirects back:
```
http://localhost:3009/api/auth/lichess/callback?
  code=<authorization_code>&
  state=<same_state>
```

**4. Backend exchanges code for token**

POST to `https://lichess.org/api/token`:
```json
{
  "grant_type": "authorization_code",
  "code": "<authorization_code>",
  "redirect_uri": "http://localhost:3009/api/auth/lichess/callback",
  "client_id": "chess-trainer-localhost",
  "code_verifier": "<pkce_verifier>"
}
```

Response:
```json
{
  "access_token": "lip_xxxxxxxxxxxx",
  "token_type": "Bearer",
  "expires_in": 31536000
}
```

**5. Backend fetches user info**

GET `https://lichess.org/api/account`:
```
Authorization: Bearer lip_xxxxxxxxxxxx
```

Response:
```json
{
  "id": "johndoe",
  "username": "JohnDoe",
  "email": "john@example.com"
}
```

**6. Backend creates/updates user in database**

**7. Backend redirects to frontend with JWT**

```
http://localhost:5179/auth/callback?token=<your_jwt_token>
```

**8. Frontend saves token and shows logged-in state**

---

## Configuration Checklist

Before deploying, verify:

- [ ] `LICHESS_CLIENT_ID` set (any string, e.g., "chess-trainer-app")
- [ ] `LICHESS_REDIRECT_URI` matches your backend callback URL
- [ ] Callback route implemented: `/api/auth/lichess/callback`
- [ ] PKCE enabled in OAuth strategy (`pkce: true`)
- [ ] Scope includes `email:read`
- [ ] User data properly saved to database
- [ ] JWT token generated and returned to frontend
- [ ] Frontend handles callback and saves token

---

## Additional Resources

- **Official Lichess OAuth Example:** https://github.com/lichess-org/api/blob/master/example/README.md
- **Lichess API Documentation:** https://lichess.org/api
- **OAuth 2.0 with PKCE Spec:** https://oauth.net/2/pkce/
- **Passport OAuth2 Strategy:** https://www.passportjs.org/packages/passport-oauth2/

---

**Last Updated:** 2026-01-27
