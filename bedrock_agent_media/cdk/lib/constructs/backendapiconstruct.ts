import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as aws_opss from 'aws-cdk-lib/aws-opensearchserverless';
import { CfnOutput } from 'aws-cdk-lib';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { AuthConstruct } from "./authconstruct";
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { Construct } from "constructs";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import {
  IFunction,
} from "aws-cdk-lib/aws-lambda";
export interface BackendApiProps extends StackProps {
  readonly bedrockRegion: string;
  readonly auth: AuthConstruct;
  readonly collectionEndpoint: string
  readonly indexName:string
}

export class BackeEndApiConstruct extends Construct {
  readonly api: HttpApi;
  readonly handler: lambda.Function;
  readonly handlerRoleStr: string
  allowOrigins = ["*"];

    constructor(scope: Construct, id: string, props: BackendApiProps) {
      super(scope, id);

    const handler = new lambda.Function(this, "Handler",{
      runtime: lambda.Runtime.PYTHON_3_10,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../lib/src/lambda/agent_call/agent_call_lambda_deployment_package.zip')), // Path to the local source ZIP file
      handler: 'semantic_lambda.lambda_handler', // Replace with the name of your handler function
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        "collectionEndpoint": props.collectionEndpoint, // Set any required environment variables
        "indexName": props.indexName
      }
  });

    
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'aoss:APIAccessAll', 'es:ESHttp*'],
        resources: ['*'],
      })
    );
    
    const api = new HttpApi(this, "backendapi", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowMethods: [
          CorsHttpMethod.GET
          ],
        allowOrigins: this.allowOrigins,
        maxAge: Duration.days(10),
      },
    });
    // Outputs for API publication
    const integration = new HttpLambdaIntegration("Integration", handler);
    const authorizer = new HttpUserPoolAuthorizer(
      "Authorizer",
      props.auth.userPool,
      {
        userPoolClients: [props.auth.client],
      }
    );
    let routeProps: any = {
      path: "/{proxy+}",
      integration,
      methods: [
        HttpMethod.GET,
        HttpMethod.POST,
        HttpMethod.PUT,
        HttpMethod.PATCH,
        HttpMethod.DELETE,
      ],
      authorizer,
    };

    api.addRoutes(routeProps);

    this.api = api;
    this.handler = handler
    new CfnOutput(this, "BackendApiUrl", { value: api.apiEndpoint });
  }
}