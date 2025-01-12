#!/usr/bin/env bash

STACK_NAME=hawkgirl-aadhaar-redirection
AWS_PROFILE=default

deploy_environment() {
  local ENV=$1
  local AWS_REGION
  local BUCKET_NAME
  local API_BASE_URL

  case $ENV in
  "dev")
    AWS_REGION=ap-south-1
    BUCKET_NAME="cfn-templates-v2-ap-south-1-dev"
    API_BASE_URL=""
    ;;
  "qa")
    AWS_REGION=ap-south-1
    BUCKET_NAME="cfn-templates-v2-ap-south-1-qa"
    API_BASE_URL=""
    ;;
  "qa2")
    AWS_REGION=eu-west-1
    BUCKET_NAME="cfn-templates-qa2"
    API_BASE_URL="https://2oby4umtdc.execute-api.eu-west-1.amazonaws.com/qa2"
    ;;
  "uat")
    AWS_REGION=ap-south-1
    BUCKET_NAME="cfn-templates-v2-ap-south-1-uat"
    API_BASE_URL="https://nk2dbo2u6e.execute-api.ap-south-1.amazonaws.com/uat"
    ;;
  "int")
    AWS_REGION=us-east-1
    BUCKET_NAME="cfn-templates-v2-int"
    API_BASE_URL="https://jn7tpygcmb.execute-api.us-east-1.amazonaws.com/int"
    ;;
  "production")
    AWS_REGION=ap-south-1
    BUCKET_NAME="cfn-oneaboveall-templates-production"
    API_BASE_URL="https://nupb32mlsh.execute-api.ap-south-1.amazonaws.com/production"
    ;;
  *)
    echo "Invalid environment: $ENV"
    return
    ;;
  esac

  echo "Replacing API_BASE_URL in init.js with $API_BASE_URL"
  sed "s~{{API_BASE_URL}}~$API_BASE_URL~g" static/js/init.js > static/js/init_modified.tmp && mv static/js/init_modified.tmp static/js/init.js

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

    sam deploy --stack-name "$STACK_NAME-$ENV" --template-file template.yaml \
      --capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM \
      --s3-bucket "$BUCKET_NAME" \
      --region "$AWS_REGION" \
      --profile "$AWS_PROFILE" \
      --parameter-overrides EnvironmentType="$ENV"
    cd static
    aws s3 sync . "s3://aadhaar-redirection-$ENV-$ACCOUNT_ID-$AWS_REGION"
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

rm -rf venv
rm -rf .env
