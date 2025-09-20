#!/bin/bash

# Google Cloud Run Deployment Script for Cirno Backend
# Make sure you have gcloud CLI installed and authenticated

# Configuration - Set these environment variables or update the values below
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
SERVICE_NAME="${SERVICE_NAME:-cirno-backend}"
REGION="${GCP_REGION:-us-central1}"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Starting deployment to Google Cloud Run..."

# Set the project
gcloud config set project $PROJECT_ID

# Build and push the Docker image
echo "📦 Building and pushing Docker image..."
gcloud builds submit --tag $IMAGE_NAME .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,GCP_PROJECT_ID=$PROJECT_ID,GCP_LOCATION=$REGION \
  --set-env-vars FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID \
  --set-env-vars FIREBASE_PRIVATE_KEY_ID=$FIREBASE_PRIVATE_KEY_ID \
  --set-env-vars FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL \
  --set-env-vars FIREBASE_CLIENT_ID=$FIREBASE_CLIENT_ID \
  --set-env-vars FIREBASE_CLIENT_X509_CERT_URL=$FIREBASE_CLIENT_X509_CERT_URL

# Set the Firebase private key as a secret
echo "🔐 Setting Firebase private key as secret..."
if ! gcloud secrets describe firebase-private-key >/dev/null 2>&1; then
  if [ -z "$FIREBASE_PRIVATE_KEY" ]; then
    echo "❌ Error: FIREBASE_PRIVATE_KEY environment variable is not set"
    echo "Please set your Firebase private key as an environment variable:"
    echo "export FIREBASE_PRIVATE_KEY='your-private-key-here'"
    exit 1
  fi
  echo "$FIREBASE_PRIVATE_KEY" | gcloud secrets create firebase-private-key --data-file=-
else
  echo "Secret already exists, skipping creation"
fi

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding firebase-private-key \
  --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update the Cloud Run service to use the secret
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --update-secrets FIREBASE_PRIVATE_KEY=firebase-private-key:latest

echo "✅ Deployment complete!"
echo "🌐 Your service is available at:"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
