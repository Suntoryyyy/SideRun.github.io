import { Client, Account, Databases } from 'appwrite';

const client = new Client();

// We will configure this with your actual server IP once your backend is running
client
    .setEndpoint('https://cloud.appwrite.io/v1') // Appwrite Cloud Endpoint
    .setProject('69da4fa9000518b6c6f0');         // SideRun Production Project ID

export const account = new Account(client);
export const databases = new Databases(client);

export default client;
