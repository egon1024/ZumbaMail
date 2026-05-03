"""
One-time script to generate a new Google OAuth token.json file.

Run this when the refresh token has expired (e.g., after 7 days in
Google Cloud "Testing" mode) and the app can no longer access
Google Sheets/Drive.

Usage:
    python util/generate_google_token.py

This will open a browser for OAuth consent. Sign in with the Google
account that owns the Drive folder and grant Sheets + Drive permissions.
"""

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

# This must be an OAuth 2.0 Client ID (Desktop app), NOT a service account key.
# Create one at: Google Cloud Console > APIs & Services > Credentials > Create > OAuth client ID
CREDS_FILE = '/home/egon/creds/client_secret.json'
TOKEN_FILE = '/home/egon/creds/token.json'

flow = InstalledAppFlow.from_client_secrets_file(CREDS_FILE, SCOPES)
creds = flow.run_local_server(port=0)

with open(TOKEN_FILE, 'w') as token:
    token.write(creds.to_json())

print(f"New token.json saved to {TOKEN_FILE}")
