import type { Request, Response } from 'express';

export default function handler (req: Request, res: Response) {
  const id = req.params.id;
  const page = req.params.page;
  res.json({ 'page': page, 'id': id });
}