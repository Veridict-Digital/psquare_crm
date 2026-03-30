# Category API Fix - Implementation Tracker

**Status: In Progress** ✅

## Approved Plan Steps:

### 1. Backend: CategoryViewSet (crm/views.py) [TODO]
```
- Fix get_queryset(): parent_id → int|None safe parsing  
- Add retrieve(), update(), destroy() methods
```
*Fixes: 404 on /api/categories/29/ & 500 on parent_id=" "*  

### 2. Frontend: ProductNew.jsx [TODO]
```
- formData: "" → null for category fields
- useQuery enabled: !!formData.category → !!parseInt(formData.category)
- queryKey: use parseInt() consistently  
- Add query error handling (isError, error)
```
*Fixes: Stops bad API calls on load + proper hierarchy*

### 3. Testing [TODO]
```
Backend: curl /api/categories/?parent_id= → []
Backend: curl /api/categories/1/ → 200 detail
Frontend: ProductNew loads without 500/404
Frontend: Category CRUD works (add/edit/delete)
```

### 4. Bonus: ProductEdit.jsx [LATER]
```
Similar fixes needed (search_files confirmed)
```

### 5. Completion [TODO]
```
Update this TODO.md → attempt_completion()
```

**Next:** Backend CategoryViewSet → Step 3 test → Frontend → Done!

