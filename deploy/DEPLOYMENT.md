# AWS Deployment Guide

## Prerequisites
1. AWS Account with necessary permissions
2. Domain name (optional)
3. SSH key pair for EC2 access

## Step 1: Database Setup (RDS)
1. Create a PostgreSQL RDS instance:
   - Go to AWS RDS Console
   - Choose PostgreSQL
   - Select db.t3.micro for development (adjust as needed)
   - Set up master username and password
   - Enable public access if needed
   - Create database

2. Note down the database connection details:
   ```
   DB_HOST=your-rds-endpoint
   DB_PORT=5432
   DB_NAME=repository_manager
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

## Step 2: EC2 Instance Setup
1. Launch an EC2 instance:
   - Amazon Linux 2 or Ubuntu Server 20.04
   - t2.micro for development (adjust as needed)
   - Configure security group:
     - Allow SSH (port 22)
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
     - Allow application port (5000)

2. Associate an Elastic IP with your EC2 instance

3. SSH into your instance:
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

4. Run the setup script:
   ```bash
   # Copy ec2-setup.sh to the instance
   scp -i your-key.pem deploy/ec2-setup.sh ec2-user@your-instance-ip:~/
   
   # Make it executable and run
   chmod +x ec2-setup.sh
   ./ec2-setup.sh
   ```

## Step 3: Application Deployment
1. Set up environment variables:
   ```bash
   # Create .env file
   sudo nano /var/www/repository-manager/.env
   ```

   Add the following (update values accordingly):
   ```
   DATABASE_URL=postgresql://user:password@your-rds-endpoint:5432/repository_manager
   AWS_REGION=your-region
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_QUEUE_URL=your-sqs-url
   ```

2. Deploy application code:
   ```bash
   # Clone repository
   git clone your-repo-url /var/www/repository-manager
   cd /var/www/repository-manager
   
   # Install dependencies
   npm install
   
   # Build the application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "repository-manager" -- start
   pm2 save
   ```

3. Configure Nginx:
   ```bash
   # Copy Nginx configuration
   sudo cp deploy/nginx.conf /etc/nginx/sites-available/repository-manager
   sudo ln -s /etc/nginx/sites-available/repository-manager /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Step 4: Domain and SSL Setup (Optional)
1. Point your domain to the Elastic IP in your DNS settings
2. Install and configure SSL with Let's Encrypt:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Maintenance
- Monitor logs: `pm2 logs repository-manager`
- Restart application: `pm2 restart repository-manager`
- Update application:
  ```bash
  cd /var/www/repository-manager
  git pull
  npm install
  npm run build
  pm2 restart repository-manager
  ```

## Troubleshooting
1. Check application logs: `pm2 logs`
2. Check Nginx logs: 
   ```bash
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```
3. Check application status: `pm2 status`
