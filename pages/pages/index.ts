import type { Request, Response } from 'express';

export default function handler (req: Request, res: Response) {
  res.send('hello there');
}

export const config = { 
  httpMethod: 'get',
  middleware: ['routeLogger', 'anotherAppLogger']
};