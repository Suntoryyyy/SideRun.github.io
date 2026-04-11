import { Client, Account, Databases } from 'appwrite';

const client = new Client();

// We will configure this with your actual server IP once your backend is running
client
    .setEndpoint('http://124.222.39.196/v1') // Your Tencent Lighthouse Server
    .setProject('YOUR_PROJECT_ID');          // We will update this soon

export const account = new Account(client);
export const databases = new Databases(client);

export default client;
