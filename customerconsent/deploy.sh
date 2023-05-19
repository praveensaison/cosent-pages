# !/usr/bin/env bash

declare -a ENV_ARRAY
ENV_ARRAY=('dev' 'qa' 'qa2' 'uat' 'int' 'production')

getIndex() {
  for i in "${!ENV_ARRAY[@]}"; do
    if [[ "${ENV_ARRAY[$i]}" == "${1}" ]]; then
      return "${i}"
    fi
  done
  return -1
}

STACK_NAME=hawkgirl-customer-consent
AWS_PROFILE=default

PS3='Please enter the environment (enter corresponding number): '
options=("dev" "qa" "qa2" "uat" "int" "production")
select opt in "${options[@]}"; do
  case $opt in
  "dev" | "qa" | "uat" | "int")
    AWS_REGION=us-east-1
    BUCKET_NAME="cfn-templates-v2-$opt"
    ENV=$opt
    break
    ;;
  "qa2")
    AWS_REGION=eu-west-1
    BUCKET_NAME=cfn-templates-qa2
    ENV=$opt
    break
    ;;
  "production")
    AWS_REGION=ap-south-1
    BUCKET_NAME=cfn-oneaboveall-templates-production
    ENV=$opt
    break
    ;;
  *) echo "invalid option" ;;
  esac
done

echo "You chose $ENV"
echo "Setting stack name as $STACK_NAME"
echo "Setting region to $AWS_REGION"
echo "Setting bucket to $BUCKET_NAME"

#Fetch the account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile $AWS_PROFILE)

echo "Deploying on AccountId: $ACCOUNT_ID"

echo "Starting deployment for distibutions"
(
  sam build

  sam deploy --stack-name $STACK_NAME --template-file ./.aws-sam/build/template.yaml \
    --capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM \
    --s3-bucket "$BUCKET_NAME" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    --parameter-overrides EnvironmentType="$ENV"

  cd static
  aws s3 sync . s3://customerconsentbucket-$ENV-$ACCOUNT_ID-$AWS_REGION
)

rm -rf venv
rm -rf .env
