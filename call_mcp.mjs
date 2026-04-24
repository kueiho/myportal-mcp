#!/usr/bin/env node
/**
 * 呼叫 my-portal-mcp 的工具
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const toolName = process.argv[2];
const toolArgs = process.argv[3] ? JSON.parse(process.argv[3]) : {};

const serverPath = '/home/jarvis/projects/my-portal-mcp/dist/index.js';

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: { ...process.env }
  });

  const client = new Client({ name: 'mcp-caller', version: '1.0.0' }, {
    capabilities: {}
  });

  await client.connect(transport);

  try {
    const result = await client.callTool({
      name: toolName,
      arguments: toolArgs
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await client.disconnect();
  }
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
