import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeType, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { CodePipeline, CodePipelineSource, ShellStep, Step } from 'aws-cdk-lib/pipelines';
import { ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import { MyPipelineAppStage } from './stage';

export class CiCdAwsPipelineDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'TestPipeline',
      codeBuildDefaults: {
        buildEnvironment: {
          computeType: ComputeType.SMALL,
          buildImage: LinuxBuildImage.STANDARD_5_0,
        },
      },
      
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection('tamiya308/aws-cicd', 'main', {
          connectionArn: 'arn:aws:codeconnections:ap-southeast-2:610433738771:connection/be5819ac-2f77-40d4-ab22-993d756a5c21',
        }),
        commands: ['npm ci', 
                   'npm run build', 
                   'npx cdk synth']
      })
    });

    
    const devStage = pipeline.addStage(new MyPipelineAppStage(this, "dev", {
      env: { account: "610433738771", region: "ap-southeast-2" }
    }));

    devStage.addPost(new ManualApprovalStep('Manual approval before uat'));

    const uatStage = pipeline.addStage(new MyPipelineAppStage(this, "uat", {
      env: { account: "610433738771", region: "ap-southeast-2" }
    }));
    
    uatStage.addPost(new ManualApprovalStep('Manual approval before production'));

    const prodStage = pipeline.addStage(new MyPipelineAppStage(this, "prod", {
      env: { account: "610433738771", region: "ap-southeast-2" }
    }));
  }
}