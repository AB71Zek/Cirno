# Deployment Setup

## Prerequisites

1. Install Google Cloud CLI
2. Authenticate: `gcloud auth login`
3. Set up your environment variables

## Environment Variables

Create a `.env` file or export these variables:

```bash
# Google Cloud Configuration
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export SERVICE_NAME="cirno-backend"

# Firebase Configuration
export FIREBASE_PROJECT_ID="your-firebase-project-id"
export FIREBASE_PRIVATE_KEY_ID="your-private-key-id"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
export FIREBASE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
export FIREBASE_CLIENT_ID="your-client-id"
export FIREBASE_CLIENT_X509_CERT_URL="https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
```

## Deployment

Run the deployment script:

```bash
./deploy.sh
```

## Security

- Never commit sensitive files like `service-account.json`
- Use environment variables for all sensitive data
- Add sensitive files to `.gitignore`
