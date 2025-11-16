from django.core.management.base import BaseCommand
from django.db import transaction
from activity.models import Location, Activity

class Command(BaseCommand):
    help = 'Merges duplicate location records into a canonical one.'

    @transaction.atomic
    def handle(self, *args, **options):
        # Define the merge map: {duplicate_id: canonical_id}
        merge_map = {
            8: 5, # Merge "Our bedroom" (ID 8) into "my bedroom" (ID 5)
        }

        self.stdout.write(self.style.SUCCESS('--- Starting Location Merge ---'))

        for duplicate_id, canonical_id in merge_map.items():
            try:
                duplicate_loc = Location.objects.get(id=duplicate_id)
                canonical_loc = Location.objects.get(id=canonical_id)
                
                self.stdout.write(f'Merging ID {duplicate_id} ("{{duplicate_loc.name}}") into ID {canonical_id} ("{{canonical_loc.name}}")...')

                # Find all activities pointing to the duplicate location
                activities_to_update = Activity.objects.filter(location=duplicate_loc)
                update_count = activities_to_update.count()

                if update_count == 0:
                    self.stdout.write(self.style.WARNING(f'  No activities found for location ID {duplicate_id}.'))
                else:
                    # Reassign activities to the canonical location
                    activities_to_update.update(location=canonical_loc)
                    self.stdout.write(f'  Reassigned {{update_count}} activities.')

                # Delete the duplicate location
                duplicate_loc.delete()
                self.stdout.write(f'  Deleted duplicate location ID {duplicate_id}.')

            except Location.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Error: Location with ID {duplicate_id} or {canonical_id} not found. Skipping.'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'An unexpected error occurred: {{e}}'))
                # The transaction.atomic decorator will roll back changes on error.

        self.stdout.write(self.style.SUCCESS('\n--- Location Merge Complete ---'))
