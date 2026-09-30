from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0082_alter_orderitem_options_alter_order_payment_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customer',
            name='phone',
            field=models.CharField(max_length=15, unique=True),
        ),
    ]
