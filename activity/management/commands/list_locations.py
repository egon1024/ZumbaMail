from django.core.management.base import BaseCommand
from activity.models import Location

class Command(BaseCommand):
    help = 'Lists all locations in the database with full details'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('--- Location Table Details ---'))
        locations = Location.objects.all().order_by('organization__name', 'name')

        if not locations:
            self.stdout.write('No locations found.')
            return

        current_org = None
        for loc in locations:
            if loc.organization.name != current_org:
                current_org = loc.organization.name
                self.stdout.write(self.style.HTTP_INFO(f'\nOrganization: {current_org}'))
            
            self.stdout.write(f'  ID: {loc.id:<5} Name: "{loc.name}"')
            self.stdout.write(f'    Address: {loc.address or "Not set"}')
            self.stdout.write(f'    Description: {loc.description or "Not set"}')


        self.stdout.write(self.style.SUCCESS('\n--- End of List ---'))
