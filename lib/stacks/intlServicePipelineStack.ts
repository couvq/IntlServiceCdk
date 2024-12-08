import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Stack, StackProps } from 'aws-cdk-lib';

export class IntlServicePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'IntlServicePipeline', {
      pipelineName: 'IntlServicePipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('couvq/IntlServiceCdk', 'main'),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });
  }
}