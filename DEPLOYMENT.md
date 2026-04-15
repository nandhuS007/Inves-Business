# Deployment Guide for Inves4Business (Hostinger VPS)

This guide outlines the steps to deploy your full-stack Inves4Business application to a Hostinger VPS using **Nginx**, **PM2**, and **SSL**.

## 1. Prepare the Application for Production

### Build the Frontend
Run the following command in your local environment to generate the production build:
```bash
npm run build
```
This will create a `dist/` folder containing your static frontend files.

### Environment Variables
Ensure you have all required secrets ready for the VPS:
- `GEMINI_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `FIREBASE_SERVICE_ACCOUNT` (Single-line JSON string)

---

## 2. Set Up Hostinger VPS

### Install Dependencies
Connect to your VPS via SSH and install the necessary tools:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx -y

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

---

## 3. Deploy the Code

1. **Upload Files**: Use SCP or Git to move your project files to `/var/www/inves4business`.
2. **Install Packages**:
   ```bash
   cd /var/www/inves4business
   npm install --production
   ```
3. **Configure Environment**: Create a `.env` file in the root directory and add your production secrets.

---

## 4. Start the Backend with PM2

Since we are using `tsx` for development, for production it is recommended to compile `server.ts` or use `tsx` directly if performance allows. To start the server:
```bash
pm2 start tsx -- server.ts --name "inves-backend"
pm2 save
pm2 startup
```

---

## 5. Configure Nginx as Reverse Proxy

Create an Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/inves4business
```

Paste the following configuration (replace `yourdomain.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend Static Files
    location / {
        root /var/www/inves4business/dist;
        index index.html;
        try_files $uri /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/inves4business /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Secure with SSL (Certbot)

Install Certbot and obtain an SSL certificate:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

---

## 7. Final Verification
- Visit `https://yourdomain.com` to see your live app.
- Test the Login/Register flow.
- Ensure Razorpay payments are working by checking the `/api/payment/create` endpoint.
