import { Stack, StackProps } from "aws-cdk-lib";
import {
    LambdaRestApi
} from "aws-cdk-lib/aws-apigateway";
import { Code, Function, HttpMethod, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class IntlServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const translateIntlFileLambda = new Function(this, 'TranslateIntlFileLambda', {
        runtime: Runtime.NODEJS_18_X,
        code: Code.fromAsset('lambda'),
        handler: 'translateIntlFile.handler'
    })

    const api = new LambdaRestApi(this, "IntlServiceApi", {
      handler: translateIntlFileLambda,
      proxy: false,
    });

    api.root.addResource("translate").addMethod(HttpMethod.POST.toString());
  }
}