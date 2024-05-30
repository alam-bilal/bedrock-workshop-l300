#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SemanticSearchStack } from "../lib/stacks/semanticsearchstack";
import { OpenSearchStack } from "../lib/stacks/opensearchstack";
import { TIdentityProvider } from "../lib/utils/identity-provider";

const app = new cdk.App();

const region = app.node.tryGetContext("region");

const collection_name = app.node.tryGetContext("collection_name");

const index_name = app.node.tryGetContext("index_name");

const OpenSearchAccessRole =app.node.tryGetContext('oss_access_role');

const IDENTITY_PROVIDERS: TIdentityProvider[] =
  app.node.tryGetContext("identityProviders");
const USER_POOL_DOMAIN_PREFIX: string = app.node.tryGetContext(
  "userPoolDomainPrefix"
);

const ALLOWED_SIGN_UP_EMAIL_DOMAINS: string[] =
  app.node.tryGetContext('allowedSignUpEmailDomains');

const ossStack = new OpenSearchStack(app, `OpenSearchStack`, {
  collectionName: collection_name,
  openSearchAccessRole: OpenSearchAccessRole
});

const openSearchCollection = ossStack.openSearchCollection;

const appStack = new SemanticSearchStack(app, `SemanticSearchStack`, {
  bedrockRegion: region,
  indexName: index_name,
  identityProviders: IDENTITY_PROVIDERS,
  userPoolDomainPrefix: USER_POOL_DOMAIN_PREFIX,
  allowedSignUpEmailDomains:
  ALLOWED_SIGN_UP_EMAIL_DOMAINS,
  openSearchCollection: openSearchCollection
});