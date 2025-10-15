
export function handler (req, res) {
  res.send(req.method);
}

export const config = {
  httpMethod: 'post',
  middleware: []
};