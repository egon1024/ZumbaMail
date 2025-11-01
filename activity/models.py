from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ObjectDoesNotExist


class Organization(models.Model):
	"""
	Represents a city rec department or other entity that hosts fitness activities.
	"""
	name = models.CharField(max_length=100)
	contact_email = models.EmailField(blank=True, null=True)
	# Add other organization-specific fields as needed

	def __str__(self):
		return self.name

class Session(models.Model):
	"""
	Represents a scheduled period (e.g., Fall 2025) for an organization. Can include multiple activities.
	"""
	organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='sessions')
	name = models.CharField(max_length=100)  # e.g., "Fall 2025"
	start_date = models.DateField()
	end_date = models.DateField()
	closed = models.BooleanField(default=False, help_text="Mark this session as closed when it has completed.")


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
		# Add more types as needed
	]
	type = models.CharField(max_length=20, choices=TYPE_CHOICES)
	session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='activities')
	day_of_week = models.CharField(max_length=10)  # e.g., "Monday"
	time = models.TimeField()
	location = models.CharField(max_length=100)
	closed = models.BooleanField(default=False, help_text="Mark this activity as closed when it has completed.")

	def __str__(self):
		return f"{self.session.name}: {self.get_type_display()} on {self.day_of_week} at {self.time.strftime('%I:%M %p')}"

class Meeting(models.Model):
	"""
	Represents a single scheduled occurrence (date) of an Activity.
	Used for tracking attendance on specific dates.
	"""
	activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='meetings')
	date = models.DateField()

	def __str__(self):
		return f"{self.activity} on {self.date}"

class Student(models.Model):
	@property
	def full_name(self):
		return f"{self.first_name} {self.last_name}".strip()
	"""
	Represents a person attending activities, including contact and emergency contact information.
	"""
	first_name = models.CharField(max_length=50)
	last_name = models.CharField(max_length=50)
	email = models.EmailField()
	phone = models.CharField(max_length=20, blank=True, null=True)
	facebook_profile = models.URLField("Facebook profile URL", blank=True, null=True)
	emergency_contact_name = models.CharField(max_length=100)
	emergency_contact_phone = models.CharField(max_length=20)
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
		('absent', 'Absent'),
		('scheduled', 'Scheduled'),
	]
	student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
	meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='attendance_records')
	status = models.CharField(max_length=10, choices=ATTENDANCE_CHOICES)
	note = models.CharField(max_length=200, blank=True, null=True)

	def __str__(self):
		return f"{self.student} - {self.meeting}: {self.status}"
