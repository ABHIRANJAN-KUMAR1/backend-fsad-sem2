import fs from 'fs/promises';
import path from 'path';

(async () => {

// Sync server data to localStorage format
const usersData = JSON.parse(await fs.readFile('./server/data/users.json', 'utf8'));
const activitiesData = JSON.parse(await fs.readFile('./server/data/activities.json', 'utf8'));
const students = usersData.filter((u: any) => u.role === 'student');

// Save users to localStorage format
fs.writeFileSync('./client/demo_users.json', JSON.stringify(users, null, 2));

// Log
console.log('Synced:', users.length, 'students');
console.log('Activities:', activities.length);

console.log('Run: cp client/demo_users.json server/data/users.json (if needed)');
console.log('Refresh app');
