#!/bin/bash

# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/repository-manager
sudo chown -R $USER:$USER /var/www/repository-manager

# Install application dependencies
cd /var/www/repository-manager
npm install

# Setup PM2 for application management
pm2 startup
pm2 save

# Setup Nginx
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
