from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("activity", "0014_alter_activity_type"),  # Update this to your latest migration
    ]

    operations = [
        migrations.RenameField(
            model_name="contact",
            old_name="phone",
            new_name="office_phone",
        ),
        migrations.AddField(
            model_name="contact",
            name="cell_phone",
            field=models.CharField(max_length=30, blank=True),
        ),
    ]
