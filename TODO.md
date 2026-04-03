# Product Pricing: Add MFG Date & Batch No Fields (Approved Plan)
Status: 🚀 In Progress

## Step 1: Backend Model Update [PENDING]
- `backend/crm/models.py`: Add `mfg_date = models.DateField(blank=True, null=True)` and `batch_no = models.CharField(max_length=100, blank=True, null=True)` after `mrp`

## Step 2: Backend Serializer Update [PENDING]
- `backend/crm/serializers.py`: Add `'mfg_date', 'batch_no'` to `ProductPricingSerializer.fields`

## Step 3: Backend Admin Update [PENDING]
- `backend/crm/admin.py`: Add `'mfg_date', 'batch_no'` to `ProductPricingAdmin.list_display`

## Step 4: Create Django Migration [PENDING]
```bash
cd backend
python manage.py makemigrations crm
python manage.py migrate
```

## Step 5: Frontend UI Update [PENDING]
- `frontend/src/pages/ProductPricing.jsx`: 
  * Add MFG Date (date picker w/ auto-open calendar) & Batch No columns after MRP
  * Update frozen column positions, editableFields array, keyboard nav
  * Auto-open date picker on MFG focus, auto-close on selection

## Step 6: Testing [PENDING]
- Backend API test: new fields appear in `/api/productpricings/`
- Frontend test: MFG calendar auto-opens/closes, Batch editable, save works
- Admin panel: columns visible

**Next Action**: Proceed to Step 1 - Update models.py

