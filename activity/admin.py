from django.contrib.admin import SimpleListFilter
from django.contrib import admin
from .models import Organization, Session, Activity, Meeting, Student, Enrollment, AttendanceRecord, Contact
from django.db import models
from django.shortcuts import render, get_object_or_404
from django.utils.html import format_html
from django.urls import reverse, path
from django.http import HttpResponse

from django import forms
from .models import Activity

class ActivityAdminForm(forms.ModelForm):
	time = forms.TimeField(
		input_formats=[
			'%I:%M %p',    # 07:30 PM
			'%I:%M%p',     # 07:30PM
			'%I:%M%P',     # 07:30pm
			'%I:%M %P',    # 07:30 pm
			'%I%p',        # 3am
			'%I %p',       # 3 am
			'%I%P',        # 3pm
			'%I %P',       # 3 pm
		],
		widget=forms.TimeInput(format='%I:%M %p'),
		label='Time (e.g., 07:30 PM, 3:00am, 3pm)'
	)

	class Meta:
		model = Activity
		fields = '__all__'

class ActivityAdmin(admin.ModelAdmin):
	form = ActivityAdminForm

class OrganizationAdmin(admin.ModelAdmin):
	list_display = ('name', 'contact_count_link')

	def contact_count_link(self, obj):
		count = obj.contacts.count()
		if count == 0:
			return '0'
		url = (
			reverse('admin:activity_contact_changelist') + f'?organization__id__exact={obj.id}'
		)
		return format_html('<a href="{}">{}</a>', url, count)
	contact_count_link.short_description = 'Contacts'

admin.site.register(Organization, OrganizationAdmin)
class ContactAdmin(admin.ModelAdmin):
	list_display = ('name', 'email', 'phone', 'role', 'organization')
	list_filter = ('organization',)
	ordering = ('organization', 'name')

admin.site.register(Contact, ContactAdmin)

class StatusListFilter(SimpleListFilter):
	title = 'Status'
	parameter_name = 'closed'
	def lookups(self, request, model_admin):
		return (
			('open', 'Open'),
			('closed', 'Closed'),
		)
	def queryset(self, request, queryset):
		if self.value() == 'open':
			return queryset.filter(closed=False)
		if self.value() == 'closed':
			return queryset.filter(closed=True)
		return queryset

class SessionAdmin(admin.ModelAdmin):
	list_display = ('id', 'name', 'organization', 'start_date', 'end_date', 'get_status')
	list_display_links = ('id',)
	ordering = ('-start_date',)
	search_fields = ('name',)
	list_filter = ('organization', 'start_date', 'end_date', StatusListFilter)

	def get_status(self, obj):
		return 'Open' if not obj.closed else 'Closed'
	get_status.short_description = 'Status'

admin.site.register(Session, SessionAdmin)
class ActivityAdmin(admin.ModelAdmin):
	list_display = ('id', 'type', 'day_of_week', 'time', 'location', 'session', 'get_status')
	list_display_links = ('id',)
	list_filter = ('type', 'day_of_week', 'location', 'session')
	search_fields = ('location',)

	def get_queryset(self, request):
		qs = super().get_queryset(request)
		return qs.filter(closed=False)

	def get_status(self, obj):
		return 'Open' if not obj.closed else 'Closed'
	get_status.short_description = 'Status'

admin.site.register(Activity, ActivityAdmin)
admin.site.register(Meeting)
class StudentAdmin(admin.ModelAdmin):

	list_display = (
		'student_links', 'first_name', 'last_name', 'email', 'phone',
		'emergency_contact_name', 'emergency_contact_phone'
	)
	search_fields = ('^last_name', '^first_name', 'email', 'phone')

	def get_search_results(self, request, queryset, search_term):
		queryset, use_distinct = super().get_search_results(request, queryset, search_term)
		if search_term:
			terms = search_term.split()
			if len(terms) == 2:
				queryset |= self.model.objects.filter(first_name__icontains=terms[0], last_name__icontains=terms[1])
			else:
				annotated = self.model.objects.annotate(
					full_name=models.functions.Concat('first_name', models.Value(' '), 'last_name')
				).filter(full_name__icontains=search_term)
				queryset |= annotated
		return queryset, use_distinct

	def student_links(self, obj):
		edit_url = reverse('admin:activity_student_change', args=[obj.pk])
		detail_url = reverse('admin:student_detail', args=[obj.pk])
		return format_html(
			'<a href="{}">Edit</a> | <a href="{}">Details</a>', edit_url, detail_url
		)
	student_links.short_description = 'Actions'

class CustomStudentAdmin(StudentAdmin):
	def get_urls(self):
		urls = super().get_urls()
		custom_urls = [
			path('<int:student_id>/details/', self.admin_site.admin_view(self.student_detail_view), name='student_detail'),
		]
		return custom_urls + urls


	def student_detail_view(self, request, student_id):
		student = get_object_or_404(Student, pk=student_id)
		return render(request, 'admin/activity/student_detail.html', {'student': student})

admin.site.register(Student, CustomStudentAdmin)

class EnrollmentAdmin(admin.ModelAdmin):
	list_display = ('id', 'student', 'activity', 'get_session', 'get_status_display')
	list_display_links = ('id',)
	list_filter = ('activity__session', 'activity', 'status')
	search_fields = ('student__first_name', 'student__last_name')

	def get_queryset(self, request):
		qs = super().get_queryset(request)
		return qs.filter(activity__closed=False)

	def get_session(self, obj):
		return obj.activity.session if obj.activity else None
	get_session.short_description = 'Session'

admin.site.register(Enrollment, EnrollmentAdmin)
admin.site.register(AttendanceRecord)
