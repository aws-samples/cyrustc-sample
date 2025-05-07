import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { WebAcl } from "../constructs/security/web-acl";

interface SecurityStackProps extends cdk.StackProps {
  apiId: string;
  apiArn: string;
  stageName: string;
}

export class SecurityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Create WAF Web ACL
    new WebAcl(this, "WebAcl", {
      apiId: props.apiId,
      apiArn: props.apiArn,
      stageName: props.stageName,
    });
  }
}
