#!/bin/bash
# Test bulk import endpoint
echo "Testing /api/products/bulk-import/"
echo "Start backend: cd backend && python manage.py runserver"

TOKEN="your_jwt_token_here" # Get from login
curl -X POST \
  -H "Authorization
