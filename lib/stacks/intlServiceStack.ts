import { Duration, Stack, StackProps } from "aws-cdk-lib";
import {
  AuthorizationType,
  LambdaRestApi,
  TokenAuthorizer,
} from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Code, Function, HttpMethod, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class IntlServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const translateIntlFileLambda = new Function(
      this,
      "TranslateIntlFileLambda",
      {
        runtime: Runtime.NODEJS_18_X,
        code: Code.fromAsset("lambda"),
        handler: "translateIntlFile.handler",
        timeout: Duration.minutes(1),
      }
    );

    const oauthUsersTable = new Table(this, "GithubUsersTable", {
      partitionKey: {
        name: "githubUserId",
        type: AttributeType.NUMBER,
      },
      tableName: "GithubUsersTable",
    });

    const githubAuthLambda = new Function(this, "GithubAuthLambda", {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("lambda/authorizer"),
      handler: "githubAuthorizer.handler",
      timeout: Duration.minutes(1),
    });

    oauthUsersTable.grantReadData(githubAuthLambda);

    const githubAuthorizer = new TokenAuthorizer(this, "GithubAuthorizer", {
      handler: githubAuthLambda,
    });

    // give lambda permission to call aws translate
    const translatePolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ["*"],
      actions: ["translate:TranslateText"],
    });
    translateIntlFileLambda.addToRolePolicy(translatePolicyStatement);

    const api = new LambdaRestApi(this, "IntlServiceApi", {
      handler: translateIntlFileLambda,
      proxy: false,
      defaultMethodOptions: {
        authorizationType: AuthorizationType.CUSTOM,
        authorizer: githubAuthorizer,
      },
    });

    api.root.addResource("translate").addMethod(HttpMethod.POST.toString());
  }
}
