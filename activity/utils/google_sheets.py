"""
Google Sheets utility functions for creating sign-in sheets
"""
import os
import gspread
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.conf import settings
from datetime import datetime, timedelta


# Define the scopes - must match the ones used when generating the token
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]


def get_refreshed_creds():
    """
    Loads credentials from token.json. If expired, uses the refresh token
    to get new ones and saves them back to token.json.
    """
    creds = None
    if os.path.exists(settings.TOKEN_FILE_PATH):
        # Load the saved token containing the access token and refresh token
        creds = Credentials.from_authorized_user_file(settings.TOKEN_FILE_PATH, SCOPES)

    # If credentials are valid, return them immediately
    if creds and creds.valid:
        return creds

    # If credentials exist but are expired (and have a refresh token)
    if creds and creds.expired and creds.refresh_token:
        # Request a new access token
        creds.refresh(Request())

        # Save the new access token back to the file
        with open(settings.TOKEN_FILE_PATH, 'w') as token:
            token.write(creds.to_json())

        print("INFO: OAuth token successfully refreshed and saved.")
        return creds

    # If creds don't exist or are otherwise invalid, raise an error
    raise FileNotFoundError(
        f"Token file is missing or invalid at {settings.TOKEN_FILE_PATH}. "
        "Please generate a new token.json file."
    )


def find_or_create_sheet_in_folder(file_name, folder_id, new_sheet_title):
    """
    Handles the core logic: search, create if missing, or add sheet if existing.

    Args:
        file_name: The target Google Sheet name (e.g., "Fri Zumba Gold")
        folder_id: The ID of the Google Drive folder where the file should be
        new_sheet_title: The name of the new worksheet to be added (e.g., "nov 9, 2025 4:25pm")

    Returns:
        The gspread Worksheet object for the sheet that was added/created
    """
    try:
        # --- 1. Authentication ---
        creds = get_refreshed_creds()

        # Drive API service for searching and creating files
        drive_service = build('drive', 'v3', credentials=creds)

        # gspread client for working with Google Sheets data
        gc = gspread.authorize(creds)

        file_id = None

        # --- 2. Search for the File in the Folder ---
        # Query: Find a file with the name, is a spreadsheet, is in the folder, and is not trashed.
        query = (
            f"name = '{file_name}' and "
            f"mimeType = 'application/vnd.google-apps.spreadsheet' and "
            f"'{folder_id}' in parents and "
            f"trashed = false"
        )

        response = drive_service.files().list(
            q=query,
            spaces='drive',
            fields='files(id, name)'
        ).execute()

        files = response.get('files', [])

        if files:
            # --- 3. File EXISTS: Add a new worksheet ---
            file_id = files[0].get('id')
            print(f"File found: '{file_name}' (ID: {file_id})")

            # Open the spreadsheet using gspread
            spreadsheet = gc.open_by_key(file_id)

            # Add a new worksheet with specified title
            worksheet = spreadsheet.add_worksheet(
                title=new_sheet_title,
                rows=100,
                cols=20
            )
            print(f"SUCCESS: Added new worksheet: '{new_sheet_title}'")
            return worksheet, spreadsheet.url

        else:
            # --- 4. File Does NOT Exist: Create new sheet in the folder ---
            print(f"File '{file_name}' not found. Creating new file...")

            file_metadata = {
                'name': file_name,
                'mimeType': 'application/vnd.google-apps.spreadsheet',
                'parents': [folder_id]  # Critical for placing it in the correct folder
            }

            new_file = drive_service.files().create(
                body=file_metadata,
                fields='id, parents'
            ).execute()

            file_id = new_file.get('id')

            # Open the newly created spreadsheet
            spreadsheet = gc.open_by_key(file_id)

            # The new file has a default "Sheet1". Rename it to the desired new_sheet_title.
            worksheet = spreadsheet.sheet1
            worksheet.update_title(new_sheet_title)

            print(f"SUCCESS: New file created and sheet renamed to: '{new_sheet_title}'")
            return worksheet, spreadsheet.url

    except HttpError as error:
        # Catch API-specific errors (e.g., folder ID is bad, permissions are wrong)
        print(f"A Google API error occurred: {error}")
        raise
    except Exception as e:
        # Catch other errors, like the missing token file
        print(f"A general error occurred: {e}")
        raise


def create_signin_sheet(activity, start_date, num_weeks, enrolled_students, waitlist_students):
    """
    Create a Google Sheets sign-in sheet for an activity

    If a spreadsheet already exists for this activity, adds a new worksheet to it.
    Otherwise, creates a new spreadsheet.

    Args:
        activity: Activity model instance
        start_date: datetime.date object for first column
        num_weeks: number of weekly date columns to create
        enrolled_students: list of Student objects (enrolled)
        waitlist_students: list of Student objects (on waitlist)

    Returns:
        str: URL of the created Google Sheet
    """
    # Spreadsheet title based on activity - include session name
    spreadsheet_title = f"{activity.session.name} - {activity.day_of_week} {activity.type}"

    # Worksheet title with timestamp: "Nov 9, 2025 4:25pm" (capitalize first letter)
    now = datetime.now()
    timestamp = now.strftime('%b %-d, %Y %-I:%M%p').lower()
    worksheet_title = timestamp[0].upper() + timestamp[1:]

    # Find or create the spreadsheet and get the worksheet
    worksheet, sheet_url = find_or_create_sheet_in_folder(
        file_name=spreadsheet_title,
        folder_id=settings.GOOGLE_DRIVE_FOLDER_ID,
        new_sheet_title=worksheet_title
    )

    # Generate date headers
    date_headers = []
    current_date = start_date
    for _ in range(num_weeks):
        date_headers.append(current_date.strftime('%-m/%-d'))
        current_date += timedelta(days=7)

    # Build the header rows
    # Row 1: Title (merged across all columns)
    title_row = [spreadsheet_title] + [''] * len(date_headers)

    # Row 2: Date headers
    header_row = [''] + date_headers

    # Build student rows
    student_rows = []
    for student in enrolled_students:
        row = [student.display_name] + [''] * len(date_headers)
        student_rows.append(row)

    # Add waitlist section - always show header even if no waitlist students
    waitlist_rows = []
    waitlist_rows.append([''] * (len(date_headers) + 1))  # Blank row
    waitlist_rows.append(['Wait List/Drop Ins:'] + [''] * len(date_headers))

    # Add waitlist students if any
    for student in waitlist_students:
        row = [student.display_name] + [''] * len(date_headers)
        waitlist_rows.append(row)

    # Add a few blank rows at the end for walk-ins
    blank_rows = [[''] * (len(date_headers) + 1) for _ in range(3)]

    # Combine all rows
    all_rows = [title_row, header_row] + student_rows + waitlist_rows + blank_rows

    # Write all data to sheet
    worksheet.update('A1', all_rows)

    # Apply formatting
    _format_signin_sheet(worksheet, len(date_headers), len(enrolled_students), len(waitlist_students))

    return sheet_url


def _format_signin_sheet(worksheet, num_date_columns, num_enrolled, num_waitlist):
    """
    Apply formatting to the sign-in sheet

    Args:
        worksheet: gspread worksheet object
        num_date_columns: number of date columns
        num_enrolled: number of enrolled students
        num_waitlist: number of waitlist students
    """
    # Format title row (row 1)
    worksheet.format('A1', {
        'textFormat': {'bold': True, 'fontSize': 18},
        'horizontalAlignment': 'CENTER'
    })

    # Merge title cells
    worksheet.merge_cells(1, 1, 1, num_date_columns + 1)

    # Format header row (row 2) - date columns
    header_range = f'B2:{chr(66 + num_date_columns)}2'
    worksheet.format(header_range, {
        'textFormat': {'bold': True},
        'horizontalAlignment': 'CENTER'
    })

    # Set column widths to "Fit to Data" using auto-resize
    try:
        requests = []
        # Auto-resize all columns (from column A to the last date column)
        requests.append({
            'autoResizeDimensions': {
                'dimensions': {
                    'sheetId': worksheet.id,
                    'dimension': 'COLUMNS',
                    'startIndex': 0,
                    'endIndex': num_date_columns + 1
                }
            }
        })
        worksheet.spreadsheet.batch_update({'requests': requests})
    except Exception as e:
        print(f"Warning: Could not auto-resize columns: {e}")

    # Add borders to the entire grid
    # Calculate end row: header row + enrolled students + blank row + waitlist header + waitlist students + blank rows
    end_row = 2 + num_enrolled + 2 + num_waitlist + 3
    grid_range = f'A2:{chr(65 + num_date_columns)}{end_row}'
    worksheet.format(grid_range, {
        'borders': {
            'top': {'style': 'SOLID'},
            'bottom': {'style': 'SOLID'},
            'left': {'style': 'SOLID'},
            'right': {'style': 'SOLID'}
        }
    })

    # Format waitlist header (always present now)
    waitlist_row = 3 + num_enrolled + 1  # After blank row
    worksheet.format(f'A{waitlist_row}', {
        'textFormat': {'bold': True}
    })
