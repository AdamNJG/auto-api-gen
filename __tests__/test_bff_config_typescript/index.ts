export async function handler (req, res) {
  await res.send('this is the base route');
}

export const config = { 
  httpMethod: 'post',
  middleware: []
};