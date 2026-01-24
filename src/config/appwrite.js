import { Client, Account, Databases, Query, ID } from 'appwrite';

// Appwrite Configuration
export const APPWRITE_CONFIG = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '666d96a5002201b52dc4',
  databaseId: '69721628000baff380b6',
  // API Key - Only for server-side operations (NOT used in client app)
  // Never expose API keys in production mobile apps
  apiKey: 'standard_a8b5cb3d34992f42e04759a296d4fc0bffdc4d64066b35bece25ba013e03dc5f0eed985a12d7b28b05394140d2ced59fd7e3813fcafdafb3c70bc58788e7e8145ea727e030a9f081a78adcaa9a065492eadfcbb2b55d95daf5dd1dfe766a873078d9e0b5036fff913074268ebf491fafe33d91a39be18ceaf083018064820275',
  apiName: 'budgetbuddyapi',
  collections: {
    users: 'users',
    categories: 'categories',
    expenses: 'expenses',
  },
};

// Initialize Appwrite Client
const client = new Client();
client
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// Initialize Services
export const account = new Account(client);
export const databases = new Databases(client);

// Export utilities
export { Query, ID };
export default client;
