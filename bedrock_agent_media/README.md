Notes: 
- Tested with python 3.11.5 on Visual Studio with AWS CLI and AWS plugin configured.
- Tested with Sagemaker notebooks t3 medium, conda_python3 kernel
- Tested in us-east-1 Region

Pre-requisites:

Make sure your Sagemaker execution role has the following policies attached:
- IAMFullAccess, 
- AmazonBedrockFullAccess, 
- AWSLambda_FullAccess, 
- SecretsManagerReadWrite

## 1.Deploy the Opensearch CDK (7min)

Here are the steps to deploy an AWS CDK application using the AWS CLI:
https://docs.aws.amazon.com/solutions/latest/research-service-workbench-on-aws/deploy-using-cdk-cli.html

Ensure you have the necessary prerequisites:

- An active AWS account

- The AWS CLI installed and configured with your AWS credentials

- Node.js and npm installed on your local machine (tested with node v20.11.1 (npm v10.2.4))

- The AWS CDK Toolkit installed globally using npm install -g aws-cdk


Then Run Below commands to create the open search collection stack

```
    cd cdk

    OPEN_SEARCH_ACCESS_ROLE=$(../getrole.sh)

    echo -e "\nRole \"${OPEN_SEARCH_ACCESS_ROLE}\" will be part of data access policy for OpenSearch" 

    npm install

    cdk synth

    cdk deploy --context oss_access_role=$OPEN_SEARCH_ACCESS_ROLE  OpenSearchStack --require-approval never

(Deployment should take ~7min)

```

## 2.OpenSearch Index build (10min) 

Pre-requisites:
Make sure your Sagemaker execution role has IAMFullAccess, AmazonBedrockFullAccess, AWSLambda_FullAccess, SecretsManagerReadWrite

Go through notebook 2 to generate the embeddings using your dataset, create an opensearch serverless index and load the embeddings into it.

You'll notably be asked to go in the opensearch console > Collections and retrieve the url (without the https) of the collection your created via the CDK deployment. See cell containing: os_host = "xxxxxxxxxxxx.us-east-1.aoss.amazonaws.com"

## 3.Agent creation (20min)

Go through notebook 3 to create the agents and implement the final step of your semantic search solution. 

