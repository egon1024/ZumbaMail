from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ObjectDoesNotExist


class Organization(models.Model):
	"""
	Represents a city rec department or other entity that hosts fitness activities.
	"""
	name = models.CharField(max_length=100)
	is_deleted = models.BooleanField(default=False)
	# Add other organization-specific fields as needed

	def __str__(self):
		return self.name

class Contact(models.Model):
	"""
	Represents a contact person for an organization.
	"""
	organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='contacts')
	name = models.CharField(max_length=100)
	office_phone = models.CharField(max_length=30, blank=True)
	cell_phone = models.CharField(max_length=30, blank=True)
	email = models.EmailField(blank=True, null=True)
	role = models.CharField(max_length=100, blank=True)

	def __str__(self):
		return f"{self.name} ({self.role})"

class Session(models.Model):
	"""
	Represents a scheduled period (e.g., Fall 2025) for an organization. Can include multiple activities.
	"""
	organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='sessions')
	name = models.CharField(max_length=100)  # e.g., "Fall 2025"
	start_date = models.DateField()
	end_date = models.DateField()
	closed = models.BooleanField(default=False, help_text="Mark this session as closed when it has completed.")

	def __str__(self):
		return f"{self.name} ({self.start_date} - {self.end_date}) [{self.organization.name}]"

	def copy_activity_from(self, previous_session, activity_id):
		"""
		Copy an activity from a previous session to this session.
		"""
		try:
			activity = previous_session.activities.get(id=activity_id)
			activity.pk = None  # Create a new instance
			activity.session = self
			activity.closed = False
			activity.save()
			return activity
		except ObjectDoesNotExist:
			return None

@receiver(post_save, sender=Session)
def close_related_activities(sender, instance, **kwargs):
	if instance.closed:
		instance.activities.update(closed=True)

	def __str__(self):
		return f"{self.name} ({self.organization.name})"

class Location(models.Model):
	"""
	Represents a physical location where activities can take place.
	"""
	organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='locations')
	name = models.CharField(max_length=100, help_text="Name of the location (e.g., 'Community Center Gym')")
	address = models.CharField(max_length=255, blank=True, help_text="Physical address of the location")
	description = models.TextField(blank=True, help_text="Additional details about the location")

	def __str__(self):
		return f"{self.name} ({self.organization.name})"

class Activity(models.Model):
	class Meta:
		verbose_name_plural = "Activities"
	"""
	Represents a specific fitness activity (e.g., Zumba, Pound), including type, day of week, time, and location.
	Belongs to a Session and Organization.
	Displayed as "Class" in the admin interface.
	"""
	TYPE_CHOICES = [
		('Zumba', 'Zumba'),
		('Pound', 'Pound'),
		('Zumba Gold', 'Zumba Gold'),
		('Aqua Zumba', 'Aqua Zumba'),
		('Cardio Drumming', 'Cardio Drumming'),
		# Add more types as needed
	]
	type = models.CharField(max_length=20, choices=TYPE_CHOICES)
	session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='activities')
	DAY_CHOICES = [
		("Monday", "Monday"),
		("Tuesday", "Tuesday"),
		("Wednesday", "Wednesday"),
		("Thursday", "Thursday"),
		("Friday", "Friday"),
		("Saturday", "Saturday"),
		("Sunday", "Sunday"),
	]
	day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES)  # e.g., "Monday"
	time = models.TimeField()
	location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
	max_capacity = models.PositiveIntegerField(
		null=True,
		blank=True,
		help_text="Maximum number of students (advisory only)"
	)
	closed = models.BooleanField(default=False, help_text="Mark this activity as closed when it has completed.")

	def __str__(self):
		location_name = self.location.name if self.location else "No Location"
		return f"{self.get_type_display()} on {self.day_of_week} at {self.time.strftime('%-I:%M %p')}"

class Meeting(models.Model):
	"""
	Represents a single scheduled occurrence (date) of an Activity.
	Used for tracking attendance on specific dates.
	"""
	activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='meetings')
	date = models.DateField()

	class Meta:
		unique_together = [['activity', 'date']]

	def __str__(self):
		return f"{self.activity.get_type_display()} on {self.date}"

class ClassCancellation(models.Model):
	"""
	Represents a cancellation of an Activity on a specific date.
	Used to mark that a class won't run on a given date with an optional reason.
	"""
	activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='cancellations')
	date = models.DateField()
	reason = models.CharField(max_length=255, blank=True, null=True, help_text="Optional reason for cancellation")
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = [['activity', 'date']]
		ordering = ['-date']

	def __str__(self):
		return f"{self.activity} cancelled on {self.date}"

class Student(models.Model):
	@property
	def display_name(self):
		return f"{self.last_name}, {self.first_name}".strip()
	active = models.BooleanField(default=True, help_text="Is this student currently active?")
	rochester = models.BooleanField(default=False, help_text="Rochester Resident")
	@property
	def full_name(self):
		return f"{self.first_name} {self.last_name}".strip()
	"""
	Represents a person attending activities, including contact and emergency contact information.
	"""
	first_name = models.CharField(max_length=50)
	last_name = models.CharField(max_length=50)
	email = models.EmailField(blank=True, null=True)
	phone = models.CharField(max_length=20, blank=True, null=True)
	facebook_profile = models.URLField("Facebook profile URL", blank=True, null=True)
	emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
	emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
	notes = models.TextField(blank=True, null=True, max_length=2048)

	def __str__(self):
		return f"{self.first_name} {self.last_name}"

class Enrollment(models.Model):
	"""
	Connects a Student to an Activity within a Session. Tracks enrollment status (active, waiting, dropped).
	"""
	STATUS_CHOICES = [
		('active', 'Active'),
		('waiting', 'Waiting List'),
		('dropped', 'Dropped'),
		('not_enrolled', 'Not Enrolled'),
	]
	student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
	activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='enrollments')
	status = models.CharField(choices=STATUS_CHOICES, default='active')
	date_enrolled = models.DateField(auto_now_add=True)

	def __str__(self):
		return f"{self.student} in {self.activity} ({self.status})"

class AttendanceRecord(models.Model):
	"""
	Connects a Student to a Meeting (specific date). Tracks attendance status and notes for each occurrence.
	"""
	ATTENDANCE_CHOICES = [
		('present', 'Present'),
		('unexpected_absence', 'Unexpected Absence'),
		('expected_absence', 'Expected Absence'),
		('scheduled', 'Scheduled'),
	]
	student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
	meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='attendance_records')
	status = models.CharField(max_length=20, choices=ATTENDANCE_CHOICES)
	note = models.CharField(max_length=200, blank=True, null=True)

	class Meta:
		unique_together = [['meeting', 'student']]

	def __str__(self):
		return f"{self.student} - {self.meeting}: {self.status}"
