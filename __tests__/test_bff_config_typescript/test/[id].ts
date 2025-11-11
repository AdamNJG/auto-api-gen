export function handler (req, res) {
  res.send(req.params.id);
}

export const config = { 
  httpMethod: 'get',
  middleware: []
};