#!/usr/bin/env bash
set -euo pipefail

# Configuration variables
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-asia-south1}"
ARTIFACT_REPO="${ARTIFACT_REPO:-northgate-chase-repo}"
SERVICE_NAME="${SERVICE_NAME:-northgate-chase}"
SA_NAME="${SA_NAME:-github-actions-deployer}"

if [ -z "${PROJECT_ID}" ]; then
  echo "Error: PROJECT_ID environment variable is required."
  echo "Usage: export PROJECT_ID=\"your-project-id\" && ./scripts/setup-gcp.sh"
  exit 1
fi

echo "Setting active Google Cloud project to: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

echo "==> 1. Enabling required Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com

echo "==> 2. Creating Artifact Registry Docker repository..."
gcloud artifacts repositories create "${ARTIFACT_REPO}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="Docker repository for Northgate Chase" \
  --project="${PROJECT_ID}" \
  --quiet || echo "Repository '${ARTIFACT_REPO}' already exists or ready."

echo "==> 3. Creating dedicated service account..."
gcloud iam service-accounts create "${SA_NAME}" \
  --display-name="GitHub Actions Cloud Run Deployer" \
  --project="${PROJECT_ID}" \
  --quiet || echo "Service account '${SA_NAME}' already exists."

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "==> 4. Binding required IAM roles to: ${SA_EMAIL}..."
# Grant Cloud Run Admin
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin" \
  --quiet

# Grant Artifact Registry Writer
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer" \
  --quiet

# Grant Service Account User
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

echo "==> 5. Generating Service Account key 'sa-key.json' for GitHub Secrets..."
gcloud iam service-accounts keys create sa-key.json \
  --iam-account="${SA_EMAIL}" \
  --project="${PROJECT_ID}"

echo ""
echo "================================================================================"
echo "GCP PREREQUISITES COMPLETED SUCCESSFULLY!"
echo "Service Account: ${SA_EMAIL}"
echo "Key file: sa-key.json"
echo ""
echo "ACTION REQUIRED:"
echo "1. Copy the content of sa-key.json and set it in your GitHub repository:"
echo "   GitHub Repo -> Settings -> Secrets and variables -> Actions -> GCP_SA_KEY"
echo "2. Delete sa-key.json locally:"
echo "   rm -f sa-key.json"
echo "================================================================================"
