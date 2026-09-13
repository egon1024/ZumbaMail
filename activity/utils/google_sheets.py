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
from django.utils import timezone
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


def create_signin_sheet(activity, date_list, enrolled_students, waitlist_enrollments=None, dropin_students=None, attendance_data=None, waitlist_students=None):
    """
    Create a Google Sheets sign-in sheet for an activity

    If a spreadsheet already exists for this activity, adds a new worksheet to it.
    Otherwise, creates a new spreadsheet.

    Args:
        activity: Activity model instance
        date_list: list of datetime.date objects for the columns
        enrolled_students: list of Student objects (enrolled)
        waitlist_enrollments: list of Enrollment objects (waiting), preferred
        dropin_students: list of Student objects (drop-ins with attendance but not enrolled/waitlisted)
        attendance_data: dict mapping {student_id: {date_str: status}} for pre-filling attendance
        waitlist_students: deprecated; use waitlist_enrollments. Accepted for compatibility.

    Returns:
        str: URL of the created Google Sheet
    """
    if attendance_data is None:
        attendance_data = {}
    if dropin_students is None:
        dropin_students = []
    if waitlist_enrollments is None:
        # Backward compatible: bare Student list with no ranks
        waitlist_enrollments = []
        if waitlist_students:
            for student in waitlist_students:
                waitlist_enrollments.append(_WaitlistEntry(student, None))

    # Spreadsheet title based on activity - include session name
    spreadsheet_title = f"{activity.session.name} - {activity.day_of_week} {activity.type}"

    # Worksheet title with timestamp: "Nov 9, 2025 4:25pm" (capitalize first letter)
    # Use timezone-aware datetime in Eastern Time
    now = timezone.now()
    timestamp = now.strftime('%b %-d, %Y %-I:%M%p').lower()
    worksheet_title = timestamp[0].upper() + timestamp[1:]

    # Find or create the spreadsheet and get the worksheet
    worksheet, sheet_url = find_or_create_sheet_in_folder(
        file_name=spreadsheet_title,
        folder_id=settings.GOOGLE_DRIVE_FOLDER_ID,
        new_sheet_title=worksheet_title
    )

    # Generate date headers and track dates for attendance lookup
    date_headers = []
    dates = []
    for current_date in date_list:
        date_headers.append(current_date.strftime('%-m/%-d'))
        dates.append(current_date.strftime('%Y-%m-%d'))

    # Columns: Rank | Name | dates...
    num_cols = len(date_headers) + 2

    # Build the header rows
    # Row 1: Title (merged across all columns)
    title_row = [spreadsheet_title] + [''] * (num_cols - 1)

    # Row 2: Rank | (name blank) | date headers
    header_row = ['Rank', ''] + date_headers

    # Build student rows with attendance marks (Rank blank for enrolled)
    student_rows = []
    for student in enrolled_students:
        row = ['', student.display_name]
        for date_str in dates:
            cell_value = ''
            if student.id in attendance_data:
                if date_str in attendance_data[student.id]:
                    status = attendance_data[student.id][date_str]
                    if status == 'expected_absence':
                        cell_value = 'X'
                    elif status == 'present':
                        cell_value = '✓'
            row.append(cell_value)
        student_rows.append(row)

    # Waitlist section — Option B:
    # ranked waitlist first (by rank), then unranked waitlist + drop-ins alphabetically
    waitlist_rows = []
    waitlist_rows.append([''] * num_cols)  # Blank row
    waitlist_rows.append(['', 'Wait List/Drop Ins:'] + [''] * len(date_headers))

    ranked_entries = []
    unranked_students = []
    for entry in waitlist_enrollments:
        student = entry.student if hasattr(entry, 'student') else entry
        rank = getattr(entry, 'waitlist_rank', None)
        if rank is not None:
            ranked_entries.append((rank, student))
        else:
            unranked_students.append(student)

    ranked_entries.sort(key=lambda item: item[0])

    remaining = unranked_students + list(dropin_students)
    remaining.sort(key=lambda s: (s.last_name or '', s.first_name or ''))

    waitlist_section_people = []
    for rank, student in ranked_entries:
        waitlist_section_people.append((rank, student))
    for student in remaining:
        waitlist_section_people.append((None, student))

    for rank, student in waitlist_section_people:
        row = [rank if rank is not None else '', student.display_name]
        for date_str in dates:
            cell_value = ''
            if student.id in attendance_data and date_str in attendance_data[student.id]:
                status = attendance_data[student.id][date_str]
                if status == 'expected_absence':
                    cell_value = 'X'
                elif status == 'present':
                    cell_value = '✓'
            row.append(cell_value)
        waitlist_rows.append(row)

    # Add a few blank rows at the end for walk-ins
    blank_rows = [[''] * num_cols for _ in range(3)]

    # Combine all rows
    all_rows = [title_row, header_row] + student_rows + waitlist_rows + blank_rows

    # Write all data to sheet
    worksheet.update('A1', all_rows)

    # Apply formatting
    _format_signin_sheet(
        worksheet,
        len(date_headers),
        len(enrolled_students),
        len(waitlist_section_people),
    )

    return sheet_url


class _WaitlistEntry:
    """Minimal stand-in when only Student objects are passed."""

    def __init__(self, student, waitlist_rank):
        self.student = student
        self.waitlist_rank = waitlist_rank


def _format_signin_sheet(worksheet, num_date_columns, num_enrolled, num_waitlist_and_dropins):
    """
    Apply formatting to the sign-in sheet

    Args:
        worksheet: gspread worksheet object
        num_date_columns: number of date columns
        num_enrolled: number of enrolled students
        num_waitlist_and_dropins: number of waitlist and drop-in students combined
    """
    num_cols = num_date_columns + 2  # Rank + Name + dates

    # Format title row (row 1)
    worksheet.format('A1', {
        'textFormat': {'bold': True, 'fontSize': 18},
        'horizontalAlignment': 'CENTER'
    })

    # Merge title cells across Rank + Name + dates
    worksheet.merge_cells(1, 1, 1, num_cols)

    # Format header row (row 2) - Rank label + date columns
    worksheet.format('A2', {
        'textFormat': {'bold': True},
        'horizontalAlignment': 'CENTER'
    })
    # Date headers start at column C
    if num_date_columns > 0:
        header_range = f'C2:{_col_letter(num_cols)}2'
        worksheet.format(header_range, {
            'textFormat': {'bold': True},
            'horizontalAlignment': 'CENTER'
        })

    # Center date column cells and Rank column
    end_row = 2 + num_enrolled + 2 + num_waitlist_and_dropins + 3
    worksheet.format(f'A3:A{end_row}', {
        'horizontalAlignment': 'CENTER',
        'verticalAlignment': 'MIDDLE'
    })
    data_range = f'C3:{_col_letter(num_cols)}{end_row}'
    worksheet.format(data_range, {
        'horizontalAlignment': 'CENTER',
        'verticalAlignment': 'MIDDLE'
    })

    # Narrow Rank column; auto-resize the rest
    try:
        requests = [
            {
                'updateDimensionProperties': {
                    'range': {
                        'sheetId': worksheet.id,
                        'dimension': 'COLUMNS',
                        'startIndex': 0,
                        'endIndex': 1,
                    },
                    'properties': {'pixelSize': 50},
                    'fields': 'pixelSize',
                }
            },
            {
                'autoResizeDimensions': {
                    'dimensions': {
                        'sheetId': worksheet.id,
                        'dimension': 'COLUMNS',
                        'startIndex': 1,
                        'endIndex': num_cols,
                    }
                }
            },
        ]
        worksheet.spreadsheet.batch_update({'requests': requests})
    except Exception as e:
        print(f"Warning: Could not resize columns: {e}")

    # Add borders to the entire grid
    grid_range = f'A2:{_col_letter(num_cols)}{end_row}'
    worksheet.format(grid_range, {
        'borders': {
            'top': {'style': 'SOLID'},
            'bottom': {'style': 'SOLID'},
            'left': {'style': 'SOLID'},
            'right': {'style': 'SOLID'}
        }
    })

    # Format waitlist header in the Name column
    waitlist_row = 3 + num_enrolled + 1  # After blank row
    worksheet.format(f'B{waitlist_row}', {
        'textFormat': {'bold': True}
    })


def _col_letter(col_number):
    """1-based column number to spreadsheet letter (supports >26)."""
    result = ''
    n = col_number
    while n > 0:
        n, remainder = divmod(n - 1, 26)
        result = chr(65 + remainder) + result
    return result
