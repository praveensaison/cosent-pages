#!/usr/bin/env bash

STACK_NAME=privo-assets
AWS_PROFILE=default

deploy_environment() {
  local ENV=$1
  local AWS_REGION
  local BUCKET_NAME

  case $ENV in
  "dev")
    AWS_REGION=ap-south-1
    BUCKET_NAME="cfn-templates-v2-ap-south-1-dev"
    ;;
  "qa")
    AWS_REGION=ap-south-1
    BUCKET_NAME="cfn-templates-v2-ap-south-1-qa"
    ;;
  "qa2")
    AWS_REGION=eu-west-1
    BUCKET_NAME="cfn-templates-qa2"
    ;;
  "uat")
    AWS_REGION=ap-south-1
    BUCKET_NAME="cfn-templates-v2-ap-south-1-uat"
    ;;
  "int")
    AWS_REGION=us-east-1
    BUCKET_NAME="cfn-templates-v2-int"
    ;;
  "production")
    AWS_REGION=ap-south-1
    BUCKET_NAME="cfn-oneaboveall-templates-production"
    ;;
  *)
    echo "Invalid environment: $ENV"
    return
    ;;
  esac


  echo "Deploying $ENV environment"
  echo "Setting stack name as $STACK_NAME"
  echo "Setting region to $AWS_REGION"
  echo "Setting bucket to $BUCKET_NAME"
  echo "Setting API base URL to $API_BASE_URL"

  # Fetch the account ID
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile $AWS_PROFILE)

  echo "Deploying on AccountId: $ACCOUNT_ID"

  echo "Starting deployment for $ENV environment"
  (
    sam build

    sam deploy --stack-name "$STACK_NAME" --template-file template.yaml \
      --capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM \
      --s3-bucket "$BUCKET_NAME" \
      --region "$AWS_REGION" \
      --profile "$AWS_PROFILE" \
      --parameter-overrides EnvironmentType="$ENV"
  )

  echo "Deployment for $ENV environment completed"
}

PS3='Please enter the environment (enter corresponding number): '
options=("dev" "qa" "qa2" "uat" "int" "production")
select opt in "${options[@]}"; do
  case $opt in
  "dev" | "qa" | "qa2" | "uat" | "int" | "production")
    deploy_environment "$opt"
    break
    ;;
  *) echo "Invalid option" ;;
  esac
done
