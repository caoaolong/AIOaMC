import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { agentConfigQueries, serverQueries, serverServiceQueries } from './db.js';
import { runCommand } from './ssh-proxy.js';

function buildTools(serverList, servicesByServer) {
  return [
    {
      name: 'list_servers',
      description: '列出所有已配置的服务器，返回 id、名称、host、备注',
      handler: () => ({ servers: serverList }),
    },
    {
      name: 'list_services',
      description: '列出某台服务器上配置的服务（如数据库、Redis 等），参数：server_id',
      handler: (serverId) => {
        const list = servicesByServer[String(serverId)] || [];
        return { server_id: serverId, services: list };
      },
    },
    {
      name: 'run_command',
      description: '在指定服务器上执行 shell 命令，参数：server_id, command。慎用，仅用于查询类命令',
      handler: (serverId, command) => {
        return new Promise((resolve, reject) => {
          runCommand(Number(serverId), command, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });
      },
    },
  ];
}

export async function chatWithAgent(configId, message, apiKey) {
  const config = agentConfigQueries.get(Number(configId));
  if (!config) throw new Error('智能体配置不存在');

  const key = apiKey || process.env.OPENAI_API_KEY || config.api_key_env && process.env[config.api_key_env];
  if (!key) throw new Error('未配置 OpenAI API Key');

  const serverList = serverQueries.list();
  const servicesByServer = {};
  for (const s of serverList) {
    servicesByServer[s.id] = serverServiceQueries.listByServer(s.id);
  }
  const tools = buildTools(serverList, servicesByServer);

  const llm = new ChatOpenAI({
    modelName: config.model || 'gpt-4o-mini',
    temperature: 0.2,
    openAIApiKey: key,
  });

  const systemContent = (config.system_prompt || '你是一个运维助手，可以查看服务器列表、各服务器上的服务，以及在服务器上执行只读类命令。请用中文回答。')
    + '\n可用工具：list_servers（无参数）、list_services(server_id)、run_command(server_id, command)。';

  const response = await llm.invoke([
    new SystemMessage(systemContent),
    new HumanMessage(message),
  ]);

  let text = response.content;
  if (typeof text !== 'string') text = String(text);

  // 简单工具调用：若模型在回复中请求执行命令，可在此解析并调用 tools（此处仅返回文本，完整 Agent 可再接 Tool 绑定）
  return { content: text, role: 'assistant' };
}
