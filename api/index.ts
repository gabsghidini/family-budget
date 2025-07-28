import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/db';
import { users, transactions, categories, familyGroups, familyGroupInvites } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Simulação simples de sessão (para produção, usar JWT ou Redis)
const sessions = new Map<string, string>();

// Helper para verificar método HTTP
function checkMethod(req: VercelRequest, res: VercelResponse, method: string) {
  if (req.method !== method) {
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return false;
  }
  return true;
}

// Helper para autenticação
function getSessionUserId(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return sessions.get(token) || null;
}

// Handler principal
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
    const segments = pathname.split('/').filter(Boolean);

    // Remover 'api' do início se presente
    if (segments[0] === 'api') {
      segments.shift();
    }

    const route = segments[0];
    const subRoute = segments[1];
    const id = segments[2];

    switch (route) {
      // Rotas de autenticação
      case 'register':
        if (!checkMethod(req, res, 'POST')) return;
        
        const { email, password, firstName, lastName } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        // Verificar se usuário já existe
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length > 0) {
          return res.status(400).json({ error: 'User already exists' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Criar usuário
        const newUser = await db.insert(users).values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
        }).returning();

        // Criar token de sessão
        const registerToken = crypto.randomUUID();
        sessions.set(registerToken, newUser[0].id);

        res.status(201).json({
          ...newUser[0],
          password: undefined, // Não retornar senha
          token: registerToken,
        });
        break;

      case 'login':
        if (!checkMethod(req, res, 'POST')) return;
        
        const { email: loginEmail, password: loginPassword } = req.body;
        
        if (!loginEmail || !loginPassword) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        // Buscar usuário
        const user = await db.select().from(users).where(eq(users.email, loginEmail)).limit(1);
        if (user.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verificar senha
        const validPassword = await bcrypt.compare(loginPassword, user[0].password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Criar token de sessão
        const loginToken = crypto.randomUUID();
        sessions.set(loginToken, user[0].id);

        res.json({
          ...user[0],
          password: undefined, // Não retornar senha
          token: loginToken,
        });
        break;

      case 'logout':
        if (!checkMethod(req, res, 'POST')) return;
        
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          sessions.delete(token);
        }
        
        res.json({ message: 'Logged out successfully' });
        break;

      case 'user':
        if (subRoute) {
          // GET /api/user/:id
          if (!checkMethod(req, res, 'GET')) return;
          const userId = subRoute;
          const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          
          if (userResult.length === 0) {
            return res.status(404).json({ error: 'User not found' });
          }
          
          res.json({ ...userResult[0], password: undefined });
        } else {
          // GET /api/user (usuário atual)
          if (!checkMethod(req, res, 'GET')) return;
          
          const currentUserId = getSessionUserId(req);
          if (!currentUserId) {
            return res.status(401).json({ error: 'Not authenticated' });
          }

          const currentUser = await db.select().from(users).where(eq(users.id, currentUserId)).limit(1);
          if (currentUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
          }

          res.json({ ...currentUser[0], password: undefined });
        }
        break;

      case 'family-groups':
        if (req.method === 'GET') {
          const groups = await db.select().from(familyGroups);
          res.json(groups);
        } else if (req.method === 'POST') {
          const { name } = req.body;
          
          if (!name) {
            return res.status(400).json({ error: 'Name is required' });
          }

          const result = await db.insert(familyGroups).values({
            name,
          }).returning();

          res.status(201).json(result[0]);
        } else {
          res.status(405).json({ error: `Method ${req.method} not allowed` });
        }
        break;

      case 'family-group-invites':
        if (subRoute && id === 'accept') {
          // POST /api/family-group-invites/:inviteId/accept
          if (!checkMethod(req, res, 'POST')) return;
          
          const inviteId = subRoute;
          const result = await db.update(familyGroupInvites)
            .set({ status: 'accepted' })
            .where(eq(familyGroupInvites.id, inviteId))
            .returning();

          if (result.length === 0) {
            return res.status(404).json({ error: 'Invite not found' });
          }

          res.json(result[0]);
        } else if (subRoute && !id) {
          // GET /api/family-group-invites/:groupId
          if (!checkMethod(req, res, 'GET')) return;
          
          const groupId = subRoute;
          const invites = await db.select().from(familyGroupInvites)
            .where(eq(familyGroupInvites.familyGroupId, groupId));
          
          res.json(invites);
        } else if (req.method === 'POST') {
          // POST /api/family-group-invites
          const { familyGroupId, invitedUserId, invitedEmail } = req.body;
          
          if (!familyGroupId || !invitedEmail) {
            return res.status(400).json({ error: 'familyGroupId and invitedEmail are required' });
          }

          const result = await db.insert(familyGroupInvites).values({
            familyGroupId,
            invitedUserId,
            invitedEmail,
            status: 'pending',
          }).returning();

          res.status(201).json(result[0]);
        } else {
          res.status(405).json({ error: `Method ${req.method} not allowed` });
        }
        break;

      case 'transactions':
        if (req.method === 'GET') {
          const { familyGroupId } = req.query;
          
          if (familyGroupId) {
            const result = await db.select().from(transactions)
              .where(eq(transactions.familyGroupId, familyGroupId as string))
              .orderBy(desc(transactions.date));
            res.json(result);
          } else {
            const result = await db.select().from(transactions).orderBy(desc(transactions.date));
            res.json(result);
          }
        } else if (req.method === 'POST') {
          const { description, amount, type, categoryId, date, familyGroupId, userId } = req.body;
          
          if (!description || amount === undefined || !type || !categoryId || !date || !familyGroupId || !userId) {
            return res.status(400).json({ error: 'All fields are required' });
          }

          const result = await db.insert(transactions).values({
            description,
            amount: parseFloat(amount),
            type,
            categoryId,
            date: new Date(date),
            familyGroupId,
            userId,
          }).returning();

          res.status(201).json(result[0]);
        } else {
          res.status(405).json({ error: `Method ${req.method} not allowed` });
        }
        break;

      case 'categories':
        if (req.method === 'GET') {
          const { familyGroupId } = req.query;
          
          if (familyGroupId) {
            const result = await db.select().from(categories)
              .where(eq(categories.familyGroupId, familyGroupId as string));
            res.json(result);
          } else {
            const result = await db.select().from(categories);
            res.json(result);
          }
        } else if (req.method === 'POST') {
          const { name, icon, color, familyGroupId, userId, type } = req.body;
          
          if (!name || !familyGroupId || !userId) {
            return res.status(400).json({ error: 'Name, familyGroupId and userId are required' });
          }

          const result = await db.insert(categories).values({
            name,
            icon: icon || 'fa-tag',
            color: color || '#1976D2',
            familyGroupId,
            userId,
            type: type || 'expense',
          }).returning();

          res.status(201).json(result[0]);
        } else {
          res.status(405).json({ error: `Method ${req.method} not allowed` });
        }
        break;

      default:
        res.status(404).json({ error: 'Not found' });
        break;
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
