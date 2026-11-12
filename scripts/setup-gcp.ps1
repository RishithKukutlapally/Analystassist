# Google Cloud Prerequisites Setup Script for PowerShell
param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = $env:PROJECT_ID,
    [string]$Region = "asia-south1",
    [string]$ArtifactRepo = "northgate-chase-repo",
    [string]$ServiceName = "northgate-chase",
    [string]$SaName = "github-actions-deployer"
)

if (-not $ProjectId) {
    Write-Error "ProjectId is required. Run: .\scripts\setup-gcp.ps1 -ProjectId 'your-gcp-project-id'"
    exit 1
}

Write-Host "Setting active Google Cloud project to: $ProjectId"
gcloud config set project "$ProjectId"

Write-Host "==> 1. Enabling required Google Cloud APIs..."
gcloud services enable `
  run.googleapis.com `
  artifactregistry.googleapis.com `
  cloudbuild.googleapis.com `
  iam.googleapis.com

Write-Host "==> 2. Creating Artifact Registry Docker repository..."
gcloud artifacts repositories create "$ArtifactRepo" `
  --repository-format=docker `
  --location="$Region" `
  --description="Docker repository for Northgate Chase" `
  --project="$ProjectId" `
  --quiet

$SaEmail = "$SaName@$ProjectId.iam.gserviceaccount.com"

Write-Host "==> 3. Creating dedicated service account..."
gcloud iam service-accounts create "$SaName" `
  --display-name="GitHub Actions Cloud Run Deployer" `
  --project="$ProjectId" `
  --quiet

Write-Host "==> 4. Binding required IAM roles to: $SaEmail..."
# Cloud Run Admin
gcloud projects add-iam-policy-binding "$ProjectId" `
  --member="serviceAccount:$SaEmail" `
  --role="roles/run.admin" `
  --quiet

# Artifact Registry Writer
gcloud projects add-iam-policy-binding "$ProjectId" `
  --member="serviceAccount:$SaEmail" `
  --role="roles/artifactregistry.writer" `
  --quiet

# Service Account User
gcloud projects add-iam-policy-binding "$ProjectId" `
  --member="serviceAccount:$SaEmail" `
  --role="roles/iam.serviceAccountUser" `
  --quiet

Write-Host "==> 5. Generating Service Account key 'sa-key.json' for GitHub Secrets..."
gcloud iam service-accounts keys create sa-key.json `
  --iam-account="$SaEmail" `
  --project="$ProjectId"

Write-Host @"
================================================================================
GCP PREREQUISITES COMPLETED SUCCESSFULLY!
Service Account: $SaEmail
Key file: sa-key.json

ACTION REQUIRED:
1. Copy the contents of sa-key.json and set it in your GitHub repository:
   GitHub Repo -> Settings -> Secrets and variables -> Actions -> GCP_SA_KEY
2. Delete sa-key.json locally:
   Remove-Item -Path sa-key.json -Force
================================================================================
"@
