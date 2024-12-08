#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { IntlServiceStack } from "../lib/stacks/intlServiceStack";

const app = new App();
new IntlServiceStack(app, "IntlServiceStack");
