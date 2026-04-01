# Product Pricing Page Fixes - Add Packaging/Extra Fields & Ensure Purchase in Landing Rate Calc
Status: [IN PROGRESS]

## Overview
Fix ProductPricing.jsx:
- Add missing UI/API for packaging_type/value, extra1_type/value, extra2_type/value
- Landing rate already includes purchase_value (base starts with it ✅)

## Steps:
- [x] **Step 1**: Add missing fields to data fetch mapping in useQuery
- [x] **Step 2**: Add Packaging, Extra1, Extra2 table columns after Delivery
- [x] **Step 3**: Update calculatePricing() to include new cost components
- [x] **Step 4**: Add EditableCell components for new fields in table rows
- [x] **Step 5**: Update saveMutation dataToSend & prepareSaveData() editableFields
- [x] **Step 6**: Update CSV export headers and row data
- [ ] **Step 7**: Test page, save functionality, calculations
- [ ] **Step 8**: Complete ✅

**File**: `frontend/src/pages/ProductPricing.jsx`

**Estimated time**: 15-20 mins

