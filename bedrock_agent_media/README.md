Tested with python 3.11.5 on Visual Studio with AWS CLI and AWS plugin configured.

## 1.Deploy the Opensearch CDK (7min)

Make sure your version of node is recent enough (e.g. node v20.11.1 (npm v10.2.4))

Run Below commands to create the open search collection stack

```
    cd cdk

    OPEN_SEARCH_ACCESS_ROLE=$(../getrole.sh)

    echo -e "\nRole \"${OPEN_SEARCH_ACCESS_ROLE}\" will be part of data access policy for OpenSearch" 

    npm install

    cdk synth

    cdk deploy --context oss_access_role=$OPEN_SEARCH_ACCESS_ROLE  OpenSearchStack --require-approval never

(Deployment should take ~7min)

```
## 2.Data Preparation (5min)

Go through notebook 1 and follow instructions to prepare the dataset.

Note that you'll be asked to download the dataset from kaggle.com notably and place the zip in the dataset folder.
Once done, you can run all cells to prepare the data for ingestion in opensearch.

## 3.OpenSearch Index build (10min) 

Go through notebook 2 to generate the embeddings using your dataset, create an opensearch serverless index and load the embeddings into it.

You'll notably be asked to go in the opensearch console > Collections and retrieve the url (without the https) of the collection your created via the CDK deployment. See cell containing: os_host = "xxxxxxxxxxxx.us-east-1.aoss.amazonaws.com"

## 4.Agent creation (20min)

Go through notebook 3 to create the agents and implement the final step of your semantic search solution. 

## 5.UI Deployment (WIP)

Deploy the UI of the application via the CDK - TBD
