// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand,AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";

const region = import.meta.env.VITE_APP_REGION;
const clientId = import.meta.env.VITE_APP_USER_POOL_CLIENT_ID;
console.log(region)
export const cognitoClient = new CognitoIdentityProviderClient({
  region: region,
});

export const signIn = async (username: string, password: string) => {
  const params = {
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  try {
    const command = new InitiateAuthCommand(params);
    const { AuthenticationResult } = await cognitoClient.send(command);
    if (AuthenticationResult) {
      sessionStorage.setItem("idToken", AuthenticationResult.IdToken || '');
      sessionStorage.setItem("accessToken", AuthenticationResult.AccessToken || '');
      sessionStorage.setItem("refreshToken", AuthenticationResult.RefreshToken || '');
      return AuthenticationResult;
    }
  } catch (error) {
    console.error("Error signing in: ", error);
    throw error;
  }
};

export const signUp = async (email: string, password: string) => {
  const params = {
    ClientId: clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  };
  try {
    const command = new SignUpCommand(params);
    const response = await cognitoClient.send(command);
    console.log("Sign up success: ", response);
    return response;
  } catch (error) {
    console.error("Error signing up: ", error);
    throw error;
  }
};

export const confirmSignUp = async (username: string, code: string) => {
  const params = {
    ClientId: clientId,
    Username: username,
    ConfirmationCode: code,
  };
  try {
    const command = new ConfirmSignUpCommand(params);
    await cognitoClient.send(command);
    console.log("User confirmed successfully");
    return true;
  } catch (error) {
    console.error("Error confirming sign up: ", error);
    throw error;
  }
};
