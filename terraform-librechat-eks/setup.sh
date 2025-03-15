#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}==== $1 ====${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_section "Checking prerequisites"

# Check if AWS CLI is installed
if ! command_exists aws; then
    echo -e "${RED}Error: AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Terraform is installed
if ! command_exists terraform; then
    echo -e "${RED}Error: Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if git is installed
if ! command_exists git; then
    echo -e "${RED}Error: Git is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}All prerequisites are installed.${NC}"

# Create terraform.tfvars if it doesn't exist
if [ ! -f terraform.tfvars ]; then
    print_section "Creating terraform.tfvars"
    cp terraform.tfvars.example terraform.tfvars
    echo -e "${GREEN}Created terraform.tfvars from example. Please review and modify if needed.${NC}"
    echo -e "${YELLOW}Press Enter to continue or Ctrl+C to abort and edit terraform.tfvars...${NC}"
    read
fi

# Initialize and apply Terraform to create ECR repository
print_section "Provisioning ECR repository with Terraform"
terraform init
terraform apply -auto-approve

# Get the ECR repository URL
ECR_REPO_URL=$(terraform output -raw repository_url)
if [ -z "$ECR_REPO_URL" ]; then
    echo -e "${RED}Error: Failed to get ECR repository URL.${NC}"
    exit 1
fi

echo -e "${GREEN}ECR repository created: $ECR_REPO_URL${NC}"

# Get AWS region from terraform.tfvars or use default
AWS_REGION=$(grep -E '^aws_region\s*=' terraform.tfvars | cut -d'"' -f2 || echo "us-west-2")

# Authenticate Docker to ECR
print_section "Authenticating Docker with ECR"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO_URL

# Clone LibreChat repository
print_section "Cloning LibreChat repository"
TEMP_DIR=$(mktemp -d)
echo "Cloning into temporary directory: $TEMP_DIR"
git clone https://github.com/danny-avila/LibreChat.git $TEMP_DIR
cd $TEMP_DIR

# Build Docker image
print_section "Building LibreChat Docker image"
docker build -t librechat:latest .

# Tag and push the image to ECR
print_section "Tagging and pushing image to ECR"
docker tag librechat:latest $ECR_REPO_URL:latest
docker push $ECR_REPO_URL:latest

# Clean up
print_section "Cleaning up"
cd -
echo "Removing temporary directory: $TEMP_DIR"
rm -rf $TEMP_DIR

# Remove local Docker image to save space
docker rmi librechat:latest $ECR_REPO_URL:latest

echo -e "\n${GREEN}Setup completed successfully!${NC}"
echo -e "${GREEN}LibreChat image is now available at: $ECR_REPO_URL:latest${NC}"
echo -e "${YELLOW}Next steps: Deploy EKS cluster and LibreChat application${NC}"