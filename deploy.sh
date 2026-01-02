#!/bin/bash

# Deployment script for PSquare CRM

echo "Starting deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx -y

# Create project directory
mkdir -p /home/ubuntu/psquare_crm
cd /home/ubuntu/psquare_crm

# Clone or copy your project files here
# git clone your-repo-url .

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Set up Django
cd backend
python manage.py collectstatic --noinput
python manage.py migrate

# Build frontend
cd ../frontend
npm install
npm run build

# Copy Nginx config
sudo cp ../nginx.conf /etc/nginx/sites-available/psquare_crm
sudo ln -s /etc/nginx/sites-available/psquare_crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Set up Gunicorn service
sudo cp ../gunicorn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn

# Set up firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "Deployment completed!"
echo "Don't forget to:"
echo "1. Update ALLOWED_HOSTS in settings.py"
echo "2. Set DEBUG=False in production"
echo "3. Configure your domain DNS"
echo "4. Set up SSL certificate"
