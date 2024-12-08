#!/usr/bin/env node
import "source-map-support/register";
import { IntlServicePipelineStack } from "../lib/stacks/intlServicePipelineStack";
import { App } from "aws-cdk-lib";

const app = new App();
new IntlServicePipelineStack(app, "IntlServicePipelineStack", {
  env: {
    account: "858422240411",
    region: "us-east-2",
  },
});

app.synth();
