# CallLog List Page Fixes - TODO

## Task: Fix all errors from CallLog list page, show entries in descending order, and fix filters

### Backend Updates:
- [ ] 1. Update `backend/crm/views.py` - Add `get_queryset` method to `CallLogViewSet`
  - [ ] Add filtering by status
  - [ ] Add filtering by employee
  - [ ] Add default ordering by date descending

### Frontend Updates:
- [ ] 2. Update `frontend/src/pages/CallLogList.jsx`
  - [ ] Fix the query to pass all filter parameters (status, employee, order_placed)
  - [ ] Ensure filters work correctly
  - [ ] Verify descending order sorting

### Testing:
- [ ] 3. Verify the changes work correctly
