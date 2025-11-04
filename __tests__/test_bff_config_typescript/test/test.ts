export function handler (req, res) {
  res.send('this is /test/test');
}

export const config = { 
  httpMethod: 'patch',
  middleware: []
};