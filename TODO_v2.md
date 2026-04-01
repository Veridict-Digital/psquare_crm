# Product Pricing REVISION TODO (User Feedback)

## Current Status: Base feature implemented. Now revise per spec.

### Model Changes [ ]
1. [ ] Add 3 new fields to ProductPricing:
   - packaging_type/packaging_value
   - extra1_type/extra1_value 
   - extra2_type/extra2_value

2. [ ] Rename final_cost → calculated_rate

3. [ ] Update save() logic:
```
Landing Rate = purchase + transport + labor + handling + godown + delivery + packaging + extra1 + extra2
Calculated Rate = Landing Rate + company_margin
sale_rate = manual input (editable!)
mrp = manual input (editable!)
```

4. [ ] Run migration: cd backend && python manage.py makemigrations crm && python manage.py migrate

### Serializer Changes [ ]
5. [ ] Update ProductPricingSerializer fields + make sale_rate/mrp writable

### Frontend Changes [ ]
6. [ ] Update ProductPricing.jsx table: add 3 new columns, rename column, make sale/mrp editable inputs

7. [ ] Update calculatePricing() to match new logic

### Testing [ ]
8. [ ] Test new calc, APIs, frontend save

**Next: Update models.py**

