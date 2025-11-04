export function handler (req, res) {
  res.send('this is /test/');
}

export const config = { 
  httpMethod: 'put',
  middleware: []
};