import type { Request, Response } from 'express';

export default function handler (req: Request, res: Response) {
  const id = req.params.id;
  res.send('hello there: ' + (id ?? ''));
}