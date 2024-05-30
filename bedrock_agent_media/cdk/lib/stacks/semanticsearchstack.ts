import { CfnOutput, RemovalPolicy, StackProps } from "aws-cdk-lib";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { AuthConstruct } from "../constructs/authconstruct";
import { FrontendConstruct } from "../constructs/frontendconstruct";
import * as cdk from "aws-cdk-lib";
import { BackeEndApiConstruct } from "../constructs/backendapiconstruct";
import { TIdentityProvider, identityProvider } from "../utils/identity-provider";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ops from 'aws-cdk-lib/aws-opensearchserverless';


export interface SemanticSearchStackProps extends StackProps {
  readonly bedrockRegion: string;
  readonly identityProviders: TIdentityProvider[];
  readonly userPoolDomainPrefix: string;
  readonly allowedSignUpEmailDomains: string[];
  readonly indexName: string;
  readonly openSearchCollection: ops.CfnCollection
}

export class SemanticSearchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SemanticSearchStackProps) {
    super(scope, id, {
      description: "Semantic Search Stack",
      ...props,
    });

    
    const idp = identityProvider(props.identityProviders);
    
    const accessLogBucket = new Bucket(this, "AccessLogBucket", {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
    });

    
    const frontend = new FrontendConstruct(this, "Frontend", {
      accessLogBucket
    });

    const auth = new AuthConstruct(this, "Auth", {
      origin: frontend.getOrigin(),
      userPoolDomainPrefixKey: props.userPoolDomainPrefix,
      idp,
      allowedSignUpEmailDomains: props.allowedSignUpEmailDomains,
    });


    const collectionEndpoint = props.openSearchCollection.attrCollectionEndpoint;
    const indexName = props.indexName;
    const backendApi = new BackeEndApiConstruct(this, "BackendApi", {
      auth,
      bedrockRegion: props.bedrockRegion,
      collectionEndpoint,
      indexName
    });

    const lambaFunction:lambda.Function = backendApi.handler
    const lambdaRoleArn = lambaFunction.role?.roleArn
    console.log("lambdaRoleArn", lambdaRoleArn);
    if (lambdaRoleArn != null) {
      this.setupOpenSearchDataAccess(lambdaRoleArn,props.openSearchCollection,props.indexName,"lambda");
    }
    frontend.buildViteApp({
      backendApiEndpoint: backendApi.api.apiEndpoint,
      userPoolDomainPrefix: props.userPoolDomainPrefix,
      auth,
      idp,
    });


    new CfnOutput(this, "FrontendURL", {
      value: frontend.getOrigin(),
    });


  }


  setupOpenSearchDataAccess(roleArn:string, ossCollection:ops.CfnCollection, 
       indexName:string, consumer:string): void {
   console.log(roleArn) 
   console.log(consumer) 
   const dataAccessPolicy = JSON.stringify(
      [
        {
          Rules: [
            {
              Resource: [`collection/${ossCollection.name}`],
              Permission: [
                'aoss:CreateCollectionItems',
                'aoss:DeleteCollectionItems',
                'aoss:UpdateCollectionItems',
                'aoss:DescribeCollectionItems',
              ],
              ResourceType: 'collection',
            },
            {
              Resource: [`index/${ossCollection.name}/*`],
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
          Principal: [roleArn],
          Description: 'data-access-rule',
        },
      ],
      null,
      2
    );
    console.log(dataAccessPolicy);
    const dataAccessPolicyName = `${ossCollection.name}-access-${consumer}`;
    if (dataAccessPolicyName.length > 32) {
      throw new Error('Policy name exceeds maximum length of 32 characters');
    }


    const cfnAccessPolicy = new ops.CfnAccessPolicy(this, `'OpssDataAccessPolicy-${consumer}'`, {
      name: dataAccessPolicyName,
      description: 'Policy for data access',
      policy: dataAccessPolicy,
      type: 'data',
    });
  }
}
