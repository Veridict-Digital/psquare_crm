# TODO: Enhance ProductCombinations Page

## Backend Changes
- [x] Add quantity field to CombinationGift model in models.py
- [x] Update CombinationGiftSerializer in serializers.py to include quantity
- [x] Modify ProductCombinationSerializer create and update methods to handle quantity in gifts_data

## Frontend Changes
- [ ] Enhance form to display selected product details (SKU, price, stock) below each dropdown in items, rewards, and gifts sections
- [ ] Add quantity input field for gifts section
- [ ] Update form state, addGift, updateGift handlers to include quantity for gifts
- [ ] Update form submission logic to handle quantity for gifts
- [ ] Update table display to show quantities for gifts

## Followup Steps
- [ ] Run Django migrations for backend model changes
- [ ] Test frontend functionality: product details display and quantity handling for gifts
- [ ] Verify form submission and data persistence
