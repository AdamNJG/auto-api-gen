import type { Request, Response } from 'express';

export default function handler (req: Request, res: Response) {
  const id = req.params.id;
  const post = req.params.post;
  res.send(`post: ${post}, commentId: ${id}`);
}