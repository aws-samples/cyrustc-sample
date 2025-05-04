import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { HelloWorldTable, HelloWorldTableProps } from "../dynamodb/hello-world-table.construct";
import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { TableInterfaces, BaseTable } from "../../core/dynamodb";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export interface DynamoDBStackProps extends NestedStackProps {
  environment?: string;
}

/**
 * DynamoDB Stack with table registry
 */
export class DynamoDBStack extends NestedStack {
  /**
   * Registry of all DynamoDB tables
   */
  private tableRegistry: Map<string, TableInterfaces.ITable> = new Map();
  
  /**
   * Environment value
   */
  private readonly environmentName: string;
  
  /**
   * Hello World table
   */
  public readonly helloWorldTable: HelloWorldTable;

  constructor(scope: Construct, id: string, props?: DynamoDBStackProps) {
    super(scope, id, props);

    // Store environment
    this.environmentName = props?.environment || this.node.tryGetContext('environment') || 'dev';
    
    // Create Hello World table directly by extending BaseTable
    this.helloWorldTable = new HelloWorldTable(this, "HelloWorldTable", {
      environment: this.environmentName
    });
    
    // Register table in registry
    this.registerTable('helloWorld', this.helloWorldTable);
  }
  
  /**
   * Register a table in the registry
   * 
   * @param id Table identifier
   * @param table Table instance
   */
  public registerTable(id: string, table: TableInterfaces.ITable): void {
    this.tableRegistry.set(id, table);
  }
  
  /**
   * Get a table from the registry
   * 
   * @param id Table identifier
   * @returns Table instance
   */
  public getTable(id: string): TableInterfaces.ITable {
    const table = this.tableRegistry.get(id);
    if (!table) {
      throw new Error(`Table with id '${id}' not found in registry`);
    }
    return table;
  }
  
  /**
   * Create a new table and register it
   * 
   * @param id Table identifier
   * @param tableProps Table properties
   * @returns The created table
   */
  public createTable(id: string, tableProps: Omit<TableInterfaces.BaseTableProps, 'environment'>): BaseTable {
    const table = new BaseTable(this, id, {
      ...tableProps,
      environment: this.environmentName
    });
    
    this.registerTable(id, table);
    return table;
  }
}
