const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Models
const Folder = require('./models/Folder');
const User = require('./models/User');

dotenv.config();

const server = new Server(
  {
    name: 'dobby-ads-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dobby-ads')
  .then(() => console.error('MCP Server connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_folder',
        description: 'Create a new folder in the Dobby Ads application',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'The username of the user creating the folder',
            },
            folderName: {
              type: 'string',
              description: 'The name of the folder to create',
            },
            parentFolderName: {
              type: 'string',
              description: 'Optional name of the parent folder (must exist). If omitted, creates in root.',
            },
          },
          required: ['username', 'folderName'],
        },
      },
      {
        name: 'upload_image',
        description: 'Mock upload an image in the Dobby Ads application (metadata only for MCP)',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'The username of the user uploading the image',
            },
            imageName: {
              type: 'string',
              description: 'The name of the image',
            },
            folderName: {
              type: 'string',
              description: 'Optional name of the folder to place the image in',
            },
            sizeInBytes: {
              type: 'number',
              description: 'Size of the mock image in bytes',
            }
          },
          required: ['username', 'imageName', 'sizeInBytes'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'create_folder') {
    const { username, folderName, parentFolderName } = request.params.arguments;

    const user = await User.findOne({ username });
    if (!user) {
      throw new McpError(ErrorCode.InvalidParams, `User ${username} not found`);
    }

    let parentId = null;
    if (parentFolderName) {
      const parent = await Folder.findOne({ name: parentFolderName, user: user._id });
      if (!parent) {
        throw new McpError(ErrorCode.InvalidParams, `Parent folder ${parentFolderName} not found for user`);
      }
      parentId = parent._id;
    }

    try {
      const newFolder = await Folder.create({
        name: folderName,
        parent: parentId,
        user: user._id
      });
      return {
        content: [
          {
            type: 'text',
            text: `Successfully created folder '${folderName}'${parentFolderName ? ` inside '${parentFolderName}'` : ' in root'}. ID: ${newFolder._id}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, error.message);
    }
  } else if (request.params.name === 'upload_image') {
    const { username, imageName, folderName, sizeInBytes } = request.params.arguments;
    const Image = require('./models/Image');

    const user = await User.findOne({ username });
    if (!user) throw new McpError(ErrorCode.InvalidParams, `User ${username} not found`);

    let folderId = null;
    if (folderName) {
      const folder = await Folder.findOne({ name: folderName, user: user._id });
      if (!folder) throw new McpError(ErrorCode.InvalidParams, `Folder ${folderName} not found for user`);
      folderId = folder._id;
    }

    try {
      const newImage = await Image.create({
        name: imageName,
        filepath: `/uploads/mock-${Date.now()}.png`,
        size: sizeInBytes,
        folder: folderId,
        user: user._id
      });
      return {
        content: [
          {
            type: 'text',
            text: `Successfully uploaded image '${imageName}'${folderName ? ` inside '${folderName}'` : ' in root'}. ID: ${newImage._id}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, error.message);
    }
  }

  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Dobby Ads MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
