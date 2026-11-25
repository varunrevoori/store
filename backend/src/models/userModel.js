import bcrypt from 'bcryptjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '../../data');
const usersFile = join(dataDir, 'users.json');

const SALT_ROUNDS = 10;

function ensureStore() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(usersFile)) {
    const seedEmail = (process.env.DEV_LOGIN_EMAIL ?? 'admin@loncrm.local').toLowerCase();
    const seedPassword = process.env.DEV_LOGIN_PASSWORD ?? 'admin123';
    const hash = bcrypt.hashSync(seedPassword, SALT_ROUNDS);
    const users = [
      {
        id: crypto.randomUUID(),
        email: seedEmail,
        password: hash,
        name: 'Admin',
        role: 'manager',
      },
    ];
    writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
  }
}

function readUsers() {
  ensureStore();
  return JSON.parse(readFileSync(usersFile, 'utf8'));
}

function writeUsers(users) {
  ensureStore();
  writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

export function findByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  return readUsers().find((u) => u.email === normalized) ?? null;
}

export function listUsers() {
  return readUsers().map(sanitizeUser);
}

export async function createUser({ email, password, name, role = 'team' }) {
  const normalized = String(email).trim().toLowerCase();
  if (findByEmail(normalized)) return { exists: true };

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = {
    id: crypto.randomUUID(),
    email: normalized,
    password: hash,
    name: name ?? normalized.split('@')[0],
    role,
  };
  const users = readUsers();
  users.push(user);
  writeUsers(users);
  return { exists: false, user: sanitizeUser(user) };
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function changePassword(email, oldPassword, newPassword) {
  const user = findByEmail(email);
  if (!user) return { ok: false, message: "credentials do not exist" };

  const passOk = await comparePassword(oldPassword, user.password);
  if (!passOk) return { ok: false, message: 'entered wrong password' };

  const users = readUsers();
  const idx = users.findIndex((u) => u.email === user.email);
  users[idx].password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  writeUsers(users);
  return { ok: true, message: 'password changed' };
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password: _p, ...rest } = user;
  return rest;
}