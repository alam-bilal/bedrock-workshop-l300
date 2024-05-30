import { StackProps, Stack, CfnOutput } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ops from 'aws-cdk-lib/aws-opensearchserverless';

export interface OpenSearchProps extends StackProps {
  readonly collectionName: string;
  readonly openSearchAccessRole: string;
}

export class OpenSearchStack extends Stack {
  public readonly searchDomain: string;
  public readonly openSearchCollection: ops.CfnCollection;
  public readonly collection_name: string;

  constructor(scope: Construct, id: string, props: OpenSearchProps) {
    super(scope, id, {
      description: "OpenSearch Stack",
      ...props,
    });

    const collectionName = props.collectionName;
    // See https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-manage.html
    const collection = new ops.CfnCollection(this, collectionName, {
      name: collectionName,
      type: 'VECTORSEARCH',
    });

    // Network security policy for OpenSearch Serverless
    const networkSecurityPolicy = JSON.stringify(
      [
        {
          Rules: [
            {
              Resource: [`collection/${collectionName}`],
              ResourceType: 'dashboard',
            },
            {
              Resource: [`collection/${collectionName}`],
              ResourceType: 'collection',
            },
          ],
          AllowFromPublic: true,
        },
      ],
      null,
      2
    );

    // Encryption security policy for OpenSearch Serverless
    const encryptionSecurityPolicy = JSON.stringify(
      {
        Rules: [
          {
            Resource: [`collection/${collectionName}`],
            ResourceType: 'collection',
          },
        ],
        AWSOwnedKey: true,
      },
      null,
      2
    );

    // Encryption policy is needed in order for the collection to be created
    const encPolicy = new ops.CfnSecurityPolicy(this, 'EncryptionSecurityPolicy', {
      name: `${collectionName}-security-policy`,
      policy: encryptionSecurityPolicy,
      type: 'encryption'
    });
    collection.addDependency(encPolicy);

    // Network policy is required so that the dashboard can be viewed!
    const netPolicy = new ops.CfnSecurityPolicy(this, 'NetworkSecurityPolicy', {
      name: `${collectionName}-network-policy`,
      policy: networkSecurityPolicy,
      type: 'network'
    });

    collection.addDependency(netPolicy);

    // data access policy
    console.log(props.openSearchAccessRole);
    if(props.openSearchAccessRole != undefined){
      const dataAccessPolicy = JSON.stringify(
        [
          {
            Rules: [
              {
                Resource: [`collection/${collectionName}`],
                Permission: [
                  'aoss:CreateCollectionItems',
                  'aoss:DeleteCollectionItems',
                  'aoss:UpdateCollectionItems',
                  'aoss:DescribeCollectionItems',
                ],
                ResourceType: 'collection',
              },
              {
                Resource: [`index/${collectionName}/*`],
                Permission: [
                  'aoss:CreateIndex',
                  'aoss:DeleteIndex',
                  'aoss:UpdateIndex',
                  'aoss:DescribeIndex',
                  'aoss:ReadDocument',
                  'aoss:WriteDocument',
                ],
                ResourceType: 'index',
              },
            ],
            Principal: [props.openSearchAccessRole],
            Description: 'data-access-rule',
          },
        ],
        null,
        2
      );

      const dataAccessPolicyName = `${collectionName}-access`;
      if (dataAccessPolicyName.length > 32) {
        throw new Error('Policy name exceeds maximum length of 32 characters');
      }
      const cfnAccessPolicy = new ops.CfnAccessPolicy(this, `'OpssDataAccessPolicy-access}'`, {
        name: dataAccessPolicyName,
        description: 'Policy for data access',
        policy: dataAccessPolicy,
        type: 'data',
      });

      collection.addDependency(cfnAccessPolicy);
    }
    this.searchDomain = collection.attrCollectionEndpoint;
    this.openSearchCollection = collection;

    new CfnOutput(this, 'collectionEndpoint', {
      value: collection.attrCollectionEndpoint,
    });
  }
 }