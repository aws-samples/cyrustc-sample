import * as cdk from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

export interface WebAclProps {
  apiId: string;
  apiArn: string;
  stageName: string;
}

export class WebAcl extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: WebAclProps) {
    super(scope, id);

    // Create WAF Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, "ApiWaf", {
      defaultAction: { allow: {} },
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "DigDocApiWaf",
        sampledRequestsEnabled: true,
      },
      rules: [
        // Rate limiting rule
        {
          name: "RateLimit",
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: "IP",
            },
          },
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "RateLimit",
          },
        },
        // AWS Managed Rules - Common Rule Set
        {
          name: "AWSManagedRulesCommonRuleSet",
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "AWSManagedRulesCommonRuleSetMetric",
          },
        },
        // AWS Managed Rules - Known Bad Inputs
        {
          name: "AWSManagedRulesKnownBadInputsRuleSet",
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesKnownBadInputsRuleSet",
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "AWSManagedRulesKnownBadInputsRuleSetMetric",
          },
        },
      ],
    });

    // Associate WAF with API Gateway stage
    new wafv2.CfnWebACLAssociation(this, "ApiWafAssociation", {
      resourceArn: `arn:aws:apigateway:${
        cdk.Stack.of(this).region
      }::/restapis/${props.apiId}/stages/${props.stageName}`,
      webAclArn: this.webAcl.attrArn,
    });

    // Add stack outputs
    new cdk.CfnOutput(this, "WebAclId", {
      value: this.webAcl.attrId,
      description: "WAF Web ACL ID",
    });

    new cdk.CfnOutput(this, "WebAclArn", {
      value: this.webAcl.attrArn,
      description: "WAF Web ACL ARN",
    });
  }
}
